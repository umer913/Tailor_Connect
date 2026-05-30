export const createNotificationController = ({ Order, Appointment }) => {
  return {
    getNotifications: async (req, res) => {
      const { email } = req.query;

      try {
        const data = await Order.find({ customer_email: email, is_notified: false })
          .sort({ created_at: -1 })
          .exec();

        res.json({ notifications: data || [] });
      } catch (err) {
        console.error("Get notifications error:", err);
        res.status(500).json({ error: "Internal Server Error" });
      }
    },

    clearAllNotifications: async (req, res) => {
      const { email } = req.body;

      try {
        await Order.updateMany(
          { customer_email: email, is_notified: false },
          { is_notified: true }
        );

        res.json({ message: "All notifications cleared" });
      } catch (err) {
        console.error("Clear notifications error:", err);
        res.status(500).json({ error: "Internal Server Error" });
      }
    },

    dismissNotification: async (req, res) => {
      const { order_id } = req.body;

      try {
        await Order.updateOne({ _id: order_id }, { is_notified: true });

        res.json({ message: "Notification dismissed" });
      } catch (err) {
        console.error("Dismiss notification error:", err);
        res.status(500).json({ error: "Internal Server Error" });
      }
    },

    getAppointmentNotifications: async (req, res) => {
      const { email } = req.query;

      try {
        const data = await Appointment.find({ customer_email: email, is_notified: false })
          .sort({ created_at: -1 })
          .exec();

        res.json({ notifications: data || [] });
      } catch (err) {
        console.error("Get appointment notifications error:", err);
        res.status(500).json({ error: "Internal Server Error" });
      }
    },

    dismissAppointmentNotification: async (req, res) => {
      const { appointment_id } = req.body;

      try {
        await Appointment.updateOne({ _id: appointment_id }, { is_notified: true });

        res.json({ message: "Notification dismissed" });
      } catch (err) {
        console.error("Dismiss appointment notification error:", err);
        res.status(500).json({ error: "Internal Server Error" });
      }
    },

    tailorNotifications: async (req, res) => {
      const { email } = req.query;

      try {
        const data = await Order.find({ tailor_email: email, is_notified: false })
          .sort({ created_at: -1 })
          .exec();

        res.json({ notifications: data || [] });
      } catch (err) {
        console.error("Get tailor notifications error:", err);
        res.status(500).json({ error: "Internal Server Error" });
      }
    },

    clearAllTailorNotifications: async (req, res) => {
      const { email } = req.body;

      try {
        await Order.updateMany(
          { tailor_email: email, is_notified: false },
          { is_notified: true }
        );

        res.json({ message: "All notifications cleared" });
      } catch (err) {
        console.error("Clear tailor notifications error:", err);
        res.status(500).json({ error: "Internal Server Error" });
      }
    },

    dismissTailorNotification: async (req, res) => {
      const { order_id } = req.body;

      try {
        await Order.updateOne({ _id: order_id }, { is_notified: true });

        res.json({ message: "Notification dismissed" });
      } catch (err) {
        console.error("Dismiss tailor notification error:", err);
        res.status(500).json({ error: "Internal Server Error" });
      }
    },

    tailorAppointmentNotifications: async (req, res) => {
      const { email } = req.query;

      try {
        const data = await Appointment.find({ tailor_email: email, is_notified: false })
          .sort({ created_at: -1 })
          .exec();

        res.json({ notifications: data || [] });
      } catch (err) {
        console.error("Get tailor appointment notifications error:", err);
        res.status(500).json({ error: "Internal Server Error" });
      }
    },

    dismissTailorAppointmentNotification: async (req, res) => {
      const { appointment_id } = req.body;

      try {
        await Appointment.updateOne({ _id: appointment_id }, { is_notified: true });

        res.json({ message: "Notification dismissed" });
      } catch (err) {
        console.error("Dismiss tailor appointment notification error:", err);
        res.status(500).json({ error: "Internal Server Error" });
      }
    },
  };
};
