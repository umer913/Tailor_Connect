export const createReviewController = ({ TailorReview, Order, toSafeRating }) => {
  return {
    getTailorReviews: async (req, res) => {
      const { tailor_id } = req.query;

      if (!tailor_id) {
        return res.status(400).json({ error: "tailor_id is required" });
      }

      try {
        const data = await TailorReview.find({ tailor_id, is_visible: true })
          .sort({ created_at: -1 })
          .exec();

        res.json({ reviews: data || [] });
      } catch (err) {
        console.error("Fetch tailor reviews failed:", err.message);
        res.status(500).json({ error: "Failed to fetch tailor reviews" });
      }
    },

    getTailorReviewsSummary: async (req, res) => {
      const { tailor_ids } = req.query;
      const filterIds = String(tailor_ids || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      try {
        const match = { is_visible: true };
        if (filterIds.length) {
          match.tailor_id = { $in: filterIds };
        }

        const data = await TailorReview.aggregate([
          { $match: match },
          {
            $group: {
              _id: "$tailor_id",
              count: { $sum: 1 },
              sum: { $sum: "$rating" },
              avg: { $avg: "$rating" },
            },
          },
        ]);

        const summary = data.reduce((acc, row) => {
          acc[row._id] = {
            count: row.count,
            sum: row.sum,
            avg: Number((row.avg || 0).toFixed(1)),
          };
          return acc;
        }, {});

        res.json({ summary });
      } catch (err) {
        console.error("Fetch review summary failed:", err.message);
        res.status(500).json({ error: "Failed to fetch review summary" });
      }
    },

    getCustomerReviews: async (req, res) => {
      const { customer_id } = req.query;

      if (!customer_id) {
        return res.status(400).json({ error: "customer_id is required" });
      }

      try {
        const data = await TailorReview.find({ customer_id })
          .sort({ created_at: -1 })
          .exec();

        res.json({ reviews: data || [] });
      } catch (err) {
        console.error("Fetch customer reviews failed:", err.message);
        res.status(500).json({ error: "Failed to fetch customer reviews" });
      }
    },

    submitTailorReview: async (req, res) => {
      const { tailor_id, customer_id, rating, description, order_id } =
        req.body || {};
      const safeRating = toSafeRating(rating);

      if (!tailor_id || !customer_id || safeRating == null) {
        return res
          .status(400)
          .json({ error: "tailor_id, customer_id, and rating are required" });
      }

      if (safeRating < 1 || safeRating > 5) {
        return res.status(400).json({ error: "rating must be between 1 and 5" });
      }

      try {
        if (order_id) {
          const order = await Order.findById(order_id)
            .select("_id customer_email tailor_email status")
            .exec();

          if (!order) {
            return res.status(404).json({ error: "Order not found" });
          }

          const isOrderPaid =
            String(order.status || "").toLowerCase() === "paid";
          if (!isOrderPaid) {
            return res.status(409).json({ error: "Order is not paid yet" });
          }

          if (
            order.customer_email !== customer_id ||
            order.tailor_email !== tailor_id
          ) {
            return res
              .status(403)
              .json({ error: "Order does not match review details" });
          }
        }

        const payload = {
          tailor_id,
          customer_id,
          rating: safeRating,
          description: description || null,
          order_id: order_id || null,
          is_visible: true,
          updated_at: new Date(),
        };

        const data = await TailorReview.findOneAndUpdate(
          { customer_id, tailor_id },
          payload,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        ).exec();

        res.json({ review: data });
      } catch (err) {
        console.error("Create review failed:", err.message);
        res.status(500).json({ error: "Failed to submit review" });
      }
    },
  };
};
