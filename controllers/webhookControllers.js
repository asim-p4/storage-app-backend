import { appendFile } from "fs/promises";
import Subscription from "../models/subscriptionModel.js";
import User from "../models/userModel.js";
import { stripeClient } from "../services/stripe.js";

export const PLAN_CATALOG = [
  {
    priceId: "price_1TWwBYDQi8FMtKNdXkcYtQN4",
    storage: 1 * 1024 ** 3,
    period: "1 TB/mo",
  },
  {
    priceId: "price_1TWwD5DQi8FMtKNdiwAN2SVy",
    storage: 1 * 1024 ** 3,
    period: "1 TB/yr",
  },
  {
    priceId: "price_1TWwEyDQi8FMtKNdfsa1mcJ6",
    storage: 5 * 1024 ** 3,
    period: "5 TB/mo",
  },
  {
    priceId: "price_1TWwFQDQi8FMtKNdAQH2Qhah",
    storage: 5 * 1024 ** 3,
    period: "5 TB/yr",
  },
  {
    priceId: "price_1TWwGhDQi8FMtKNdWZJbOIdJ",
    storage: 10 * 1024 ** 3,
    period: "10 TB/mo",
  },
  {
    priceId: "price_1TWwH6DQi8FMtKNdqb8CxdFo",
    storage: 10 * 1024 ** 3,
    period: "10 TB/yr",
  },
];

export const webhookVerify = (req, res, next) => {
  let event;
  const signature = req.headers["stripe-signature"];
  try {
    event = stripeClient.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    next(err);
  }
  req.body = event;
  next();
};

export const webhook = async (req, res) => {
  console.log("webhook running");

  if (req.body.type === "checkout.session.completed") {
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
      return res.status(200).json({ message: "session completed" });
    }
  }

  if (req.body.type === "customer.subscription.created") {
    const { id: sub_id, status: payment_status } = req.body.data.object;
    const { id: price_id } = req.body.data.object.items.data[0].plan;
    await appendFile("text.json", JSON.stringify(req.body, null, 2));
    const { userId } = await Subscription.findOneAndUpdate(
      { stripeSubscriptionId: sub_id },
      {
        status: payment_status,
      },
      { new: true },
    );

    if (payment_status === "active") {
      const { storage } = PLAN_CATALOG.find(
        ({ priceId }) => priceId === price_id,
      );
      await User.findByIdAndUpdate(userId, { maxStorageInBytes: storage });
      return res.status(200).json({ message: "successfully paid" });
    }
  }

  res.end("done");
};
