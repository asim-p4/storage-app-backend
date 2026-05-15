import Subscription from "../models/subscriptionModel.js";
import { stripeClient } from "../services/stripe.js";

export const createSubscription = async (req, res, next) => {
  const priceId = req.body.id;
  const userId = req.user._id;

  try {
    const session = await stripeClient.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      payment_method_types: ["card"],
      client_reference_id: userId,
      success_url: "http://localhost:5173",
      cancel_url: "https://www.youtube.com",
    });

    const subscription = await Subscription.create({
      userId,
      priceId,
      stripeCheckoutSessionId: session.id,
    });

    res.json({ sessionUrl: session.url });
  } catch (err) {
    console.log(err);
    next(err);
  }
};
