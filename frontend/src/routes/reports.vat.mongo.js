// routes/reports.vat.mongo.js
const express = require("express");

/**
 * VAT report (MongoDB)
 * GET /api/reports/vat?from=YYYY-MM-DD&to=YYYY-MM-DD&groupBy=invoice|day&page=0&size=20
 */
module.exports = function buildVatRouter(db) {
  const router = express.Router();

  const SALES = db.collection("sales");
  const CUSTOMERS = db.collection("customers");

  /* ------------------------------- helpers ------------------------------- */

  const toRange = (fromYMD, toYMD) => ({
    start: new Date(`${fromYMD}T00:00:00.000Z`),
    end:   new Date(`${toYMD}T23:59:59.999Z`),
  });

  // Build a nested $ifNull chain: coalesce(["$a","$b","$c"], "")
  const coalesce = (fields, fallback = "") =>
    fields.reduceRight((acc, f) => ({ $ifNull: [f, acc] }), fallback);

  // Extract { items, totals, count } from a $facet result
  const unpackFacet = (box) => ({
    items:  box?.items ?? [],
    totals: (box?.totals && box.totals[0]) || { taxable: 0, vat: 0, total: 0 },
    count:  (box?.count  && box.count[0]?.count) || 0,
  });

  /* --------------------------- common pipeline bits --------------------------- */

  // Normalize totals, invoice and bring customer hints to top-level
  const deriveSaleFields = {
    $addFields: {
      taxable: { $ifNull: ["$taxable", { $sum: "$items.taxable" }] },
      vat:     { $ifNull: ["$vat",     { $sum: "$items.vat" }] },
      total:   { $ifNull: ["$total",   { $sum: "$items.total" }] },

      // coalesce invoice across common field names
      invoice: coalesce(
        ["$invoice", "$invoiceNo", "$number", "$saleNo", "$receiptNo", "$docNo", "$ref", "$reference"],
        ""
      ),

      // Embedded customer → label
      customerLabelFromDoc: {
        $let: { vars: { c: { $ifNull: ["$customer", {}] } }, in: {
          $switch: {
            branches: [
              {
                case: { $and: [{ $ifNull: ["$$c.name", false] }, { $ifNull: ["$$c.code", false] }] },
                then: { $concat: ["$$c.name", " (", "$$c.code", ")"] },
              },
              { case: { $ifNull: ["$$c.name", false] },     then: "$$c.name"     },
              { case: { $ifNull: ["$$c.fullName", false] }, then: "$$c.fullName" },
            ],
            // flat fallbacks on the sale doc
            default: coalesce(["$customerName", "$partyName"], ""),
          }
        }}
      },

      customerCodeFromDoc: { $ifNull: ["$customerCode", { $ifNull: ["$customer.code", ""] }] },

      // Keep a string form if customerId exists; used to try ObjectId match
      customerIdStr: {
        $cond: [
          { $eq: [{ $type: "$customerId" }, "objectId"] },
          { $toString: "$customerId" },
          { $ifNull: ["$customerId", ""] },
        ],
      },
    },
  };

  // Safely lookup customer by _id (ObjectId or 24hex string) OR by code
  const attachCustomerFromMaster = {
    $lookup: {
      from: CUSTOMERS.collectionName,
      let: { cid: "$customerId", cidStr: "$customerIdStr", ccode: "$customerCodeFromDoc" },
      pipeline: [
        {
          $match: {
            $expr: {
              $or: [
                // already an ObjectId
                { $eq: ["$_id", "$$cid"] },

                // string convertible to ObjectId (only if 24-hex)
                {
                  $and: [
                    { $eq: [{ $type: "$$cidStr" }, "string"] },
                    { $eq: [{ $strLenCP: "$$cidStr" }, 24] },
                    {
                      $regexMatch: { input: "$$cidStr", regex: /^[0-9a-fA-F]{24}$/ }
                    },
                    { $eq: ["$_id", { $toObjectId: "$$cidStr" }] },
                  ],
                },

                // by code
                { $and: [{ $ifNull: ["$code", false] }, { $eq: ["$code", "$$ccode"] }] },
              ],
            },
          },
        },
        { $project: { _id: 1, name: 1, code: 1 } },
      ],
      as: "_c",
    },
  };

  const addFinalCustomerLabel = {
    $addFields: {
      customer: {
        $let: { vars: { c: { $arrayElemAt: ["$_c", 0] } }, in: {
          $cond: [
            { $gt: [{ $size: "$_c" }, 0] },
            {
              $cond: [
                { $and: [{ $ifNull: ["$$c.name", false] }, { $ifNull: ["$$c.code", false] }] },
                { $concat: ["$$c.name", " (", "$$c.code", ")"] },
                { $ifNull: ["$$c.name", { $ifNull: ["$$c.code", ""] }] },
              ],
            },
            "$customerLabelFromDoc",
          ],
        }},
      },
    },
  };

  /* --------------------------------- route --------------------------------- */

  router.get("/api/reports/vat", async (req, res) => {
    try {
      const { from, to } = req.query;
      if (!from || !to) {
        return res.status(400).json({ message: "from/to are required (YYYY-MM-DD)" });
      }

      const groupBy = String(req.query.groupBy || "invoice").toLowerCase(); // 'invoice' | 'day'
      const page = Math.max(0, parseInt(req.query.page ?? 0, 10));
      const size = Math.min(500, Math.max(1, parseInt(req.query.size ?? 20, 10)));
      const skip = page * size;

      const { start, end } = toRange(from, to);

      if (groupBy === "invoice") {
        const pipeline = [
          { $match: { date: { $gte: start, $lte: end } } },
          deriveSaleFields,
          attachCustomerFromMaster,
          addFinalCustomerLabel,
          { $project: { _c: 0, customerLabelFromDoc: 0, customerCodeFromDoc: 0, customerIdStr: 0 } },
          { $sort: { date: 1, invoice: 1 } },
          {
            $facet: {
              items: [
                { $skip: skip }, { $limit: size },
                {
                  $project: {
                    _id: 0,
                    date:    { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                    invoice: { $ifNull: ["$invoice", ""] },
                    customer:{ $ifNull: ["$customer", ""] },
                    taxable: { $ifNull: ["$taxable", 0] },
                    vat:     { $ifNull: ["$vat", 0] },
                    total:   { $ifNull: ["$total", 0] },
                  },
                },
              ],
              totals: [
                {
                  $group: {
                    _id: null,
                    taxable: { $sum: { $ifNull: ["$taxable", 0] } },
                    vat:     { $sum: { $ifNull: ["$vat", 0] } },
                    total:   { $sum: { $ifNull: ["$total", 0] } },
                  },
                },
              ],
              count: [{ $count: "count" }],
            },
          },
        ];

        const box = (await SALES.aggregate(pipeline, { allowDiskUse: true }).toArray())[0] || {};
        return res.json(unpackFacet(box));
      }

      // group by day
      const pipeline = [
        { $match: { date: { $gte: start, $lte: end } } },
        deriveSaleFields,
        {
          $group: {
            _id:     { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            bills:   { $sum: 1 },
            taxable: { $sum: { $ifNull: ["$taxable", 0] } },
            vat:     { $sum: { $ifNull: ["$vat", 0] } },
            total:   { $sum: { $ifNull: ["$total", 0] } },
          },
        },
        { $project: { _id: 0, date: "$_id", bills: 1, taxable: 1, vat: 1, total: 1 } },
        { $sort: { date: 1 } },
        {
          $facet: {
            items:  [{ $skip: skip }, { $limit: size }],
            totals: [{ $group: { _id: null, taxable: { $sum: "$taxable" }, vat: { $sum: "$vat" }, total: { $sum: "$total" } } }],
            count:  [{ $count: "count" }],
          },
        },
      ];

      const box = (await SALES.aggregate(pipeline, { allowDiskUse: true }).toArray())[0] || {};
      return res.json(unpackFacet(box));
    } catch (err) {
      console.error("VAT report (mongo) error:", err);
      res.status(500).json({ message: "Server error generating VAT report" });
    }
  });

  return router;
};
