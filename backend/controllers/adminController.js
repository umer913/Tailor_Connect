export const createAdminController = ({ Profile, Order, Complaint }) => {
  return {
    getTailors: async (_req, res) => {
      try {
        const data = await Profile.find({ role: "tailor" })
          .select("email full_name cnic phone_number location")
          .exec();

        res.json({ tailors: data });
      } catch (err) {
        res.status(500).json({ message: "Error fetching tailors" });
      }
    },

    removeTailor: async (req, res) => {
      const { email } = req.body;

      try {
        await Order.deleteMany({ tailor_email: email });
        await Profile.deleteOne({ email, role: "tailor" });

        res.json({ message: "Tailor and related orders removed successfully" });
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error removing tailor" });
      }
    },

    getCustomers: async (_req, res) => {
      try {
        const data = await Profile.find({ role: "customer" })
          .select("email full_name phone_number location")
          .exec();

        res.json({ customers: data });
      } catch (err) {
        console.error("Get customers error:", err);
        res.status(500).json({ message: "Error fetching customers" });
      }
    },

    removeCustomer: async (req, res) => {
      const { email } = req.body;

      try {
        await Profile.deleteOne({ email, role: "customer" });

        res.json({ message: "Customer removed successfully" });
      } catch (err) {
        console.error("Remove customer error:", err);
        res.status(500).json({ message: "Error removing customer" });
      }
    },

    removeOrder: async (req, res) => {
      const { id } = req.params;

      try {
        await Order.deleteOne({ _id: id });

        res.json({ message: "Order removed successfully" });
      } catch (error) {
        console.error("Error deleting order:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    },

    getComplaints: async (_req, res) => {
      try {
        console.log("Admin fetching all complaints");

        const data = await Complaint.find({}).sort({ created_at: -1 }).exec();

        console.log("Total Complaints:", data.length);
        res.json(data);
      } catch (err) {
        console.log("Admin Error:", err.message);
        res.status(500).json({ error: err.message });
      }
    },

    respondComplaint: async (req, res) => {
      try {
        const { id } = req.params;
        const { admin_response } = req.body;

        const data = await Complaint.findOneAndUpdate(
          { _id: id },
          { admin_response, resolved_at: new Date() },
          { new: true }
        ).exec();

        console.log(`Complaint ${id} resolved with message: ${admin_response}`);
        res.json({ message: "Resolved and message sent", data });
      } catch (err) {
        console.log("Resolve Error:", err.message);
        res.status(500).json({ error: err.message });
      }
    },

    sendMessage: async (req, res) => {
      try {
        const { complaint_id, message } = req.body;

        const data = await Complaint.findOneAndUpdate(
          { _id: complaint_id },
          { admin_response: message },
          { new: true }
        ).exec();

        console.log(`Message sent for complaint ${complaint_id}: ${message}`);
        res.json({ message: "Message sent successfully", data });
      } catch (err) {
        console.log("Send Message Error:", err.message);
        res.status(500).json({ error: err.message });
      }
    },
  };
};
