import { appendFile } from "fs/promises";
import Subscription from "../models/subscriptionModel.js";

export const webhook = async (req, res) => {
  console.log("webhooks");

  if (req.body.type === "checkout.session.completed") {
    console.log("checkout.session.completed");

    const {
      client_reference_id: user_id,
      customer: cus_id,
      subscription: sub_id,
      status: cs_status,
    } = req.body.data.object;

    await Subscription.findOneAndUpdate(
      { userId: user_id },
      {
        stripeCustomerId: cus_id,
        stripeSubscriptionId: sub_id,
      },
      { new: true },
    );
    if (cs_status === "complete") {
      console.log("session completed");
      return res.status(200).json({ message: "session completed" });
    }
  }

  if (req.body.type === "customer.subscription.created") {
    console.log("customer.subscription.created");

    const { id: sub_id, status: payment_status } = req.body.data.object;

    await Subscription.findOneAndUpdate(
      { stripeSubscriptionId: sub_id },
      {
        status: payment_status,
      },
      { new: true },
    );

    if (payment_status === "active") {
      console.log("payment paid");
      return res.status(200).json({ message: "successfully paid" });
    }
  }

  res.end("done");
};
