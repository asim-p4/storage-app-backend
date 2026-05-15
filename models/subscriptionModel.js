import { model, Schema } from "mongoose";

const subscriptionSchema = new Schema(
  {
    priceId: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    stripeCustomerId: {
      type: String,
    },
    stripeSubscriptionId: {
      type: String,
    },
    stripeCheckoutSessionId: {
      type: String,
    },
    status: {
      type: String,
      enum: [
        "incomplete",
        "incomplete_expired",
        "trialing",
        "active",
        "past_due",
        "canceled",
        "unpaid",
        "paused",
      ],
      default: "incomplete",
    },
  },

  {
    strict: "throw",

    timestamps: true,
  },
);

const Subscription = model("Subscription", subscriptionSchema);

export default Subscription;
