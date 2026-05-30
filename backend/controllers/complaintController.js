export const createComplaintController = ({ Complaint, Profile, Order }) => {
  return {
    fileComplaint: async (req, res) => {
      try {
        const {
          filed_by_email,
          filed_by_role,
          against_email,
          complaint_type,
          subject,
          description,
          order_id,
          attachment_url,
        } = req.body;

        const specialIssues = [
          "Payment Issue",
          "Late Delivery",
          "Wrong Measurement",
          "Bad Stitching",
          "Misbehaviour",
        ];

        if (!filed_by_email || !subject || !description || !complaint_type) {
          return res.status(400).json({ error: "Missing required fields" });
        }

        if (specialIssues.includes(complaint_type)) {
          if (!against_email || !order_id) {
            return res.status(400).json({
              error: "Tailor email and Order ID are required for this complaint type",
            });
          }

          const profileData = await Profile.findOne({ email: against_email })
            .select("email")
            .exec();

          if (!profileData) {
            return res.status(400).json({
              error: "Tailor email not found in system",
            });
          }

          const orderData = await Order.findById(order_id)
            .select("_id")
            .exec();

          if (!orderData) {
            return res.status(400).json({
              error: "Order ID not found",
            });
          }
        }

        const data = await Complaint.create({
          filed_by_email,
          filed_by_role,
          against_email: against_email || null,
          complaint_type,
          subject,
          description,
          order_id: order_id || null,
          attachment_url,
        });

        res.status(201).json({
          message: "Complaint submitted successfully",
          data,
        });
      } catch (err) {
        console.log("Server Error:", err.message);
        res.status(500).json({ error: err.message });
      }
    },

    getMyComplaints: async (req, res) => {
      try {
        const { email } = req.params;
        console.log("Fetching complaints for:", email);

        const data = await Complaint.find({ filed_by_email: email })
          .sort({ created_at: -1 })
          .exec();

        console.log("Complaints Found:", data.length);

        res.json(data);
      } catch (err) {
        console.log("Fetch Error:", err.message);
        res.status(500).json({ error: err.message });
      }
    },

    followUp: async (req, res) => {
      try {
        const { complaint_id, filed_by_email, message } = req.body;
        const cleanMessage = String(message || "").trim();

        if (!complaint_id || !filed_by_email || !cleanMessage) {
          return res
            .status(400)
            .json({ error: "complaint_id, filed_by_email and message are required" });
        }

        const complaint = await Complaint.findById(complaint_id)
          .select("_id filed_by_email resolved_at description")
          .exec();

        if (!complaint) {
          return res.status(404).json({ error: "Complaint not found" });
        }

        if (
          String(complaint.filed_by_email || "").toLowerCase() !==
          String(filed_by_email).toLowerCase()
        ) {
          return res
            .status(403)
            .json({ error: "You can only add follow-up to your own complaint" });
        }

        if (complaint.resolved_at) {
          return res.status(400).json({ error: "Complaint is already resolved" });
        }

        const followUpBlock = `\n\n[Follow-up ${new Date().toISOString()}]\n${cleanMessage}`;
        const updatedDescription = `${complaint.description || ""}${followUpBlock}`.trim();

        complaint.description = updatedDescription;
        await complaint.save();

        res.json({ message: "Follow-up added", data: complaint });
      } catch (err) {
        console.log("Follow-up Error:", err.message);
        res.status(500).json({ error: err.message || "Failed to add follow-up" });
      }
    },

    deleteComplaint: async (req, res) => {
      try {
        const { id, email } = req.params;

        await Complaint.deleteOne({ _id: id, filed_by_email: email });

        res.status(200).json({ message: "Complaint deleted successfully" });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    },
  };
};
