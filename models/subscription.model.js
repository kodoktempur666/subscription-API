import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minLength: 2,
      maxLength: 100,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price must be a positive number"],
    },
    currency: {
      type: String,
      enum: ["USD", "EUR", "GBP"],
      default: "USD",
    },
    frequency: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly"],
    },
    category: {
      type: String,
      enum: ["sport", "news", "entertainment", "education"],
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "canceled", "expired"],
      default: "active",
    },
    startDate: {
      type: Date,
      required: true,
      validate: {
        validator: (v) => v <= new Date(),
        message: "Start date must be in the past ",
      },
    },
    renewalDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (v) {
          return v > this.startDate;
        },
        message: "Renewal date must be after start date",
      },
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);


// auto calculate the renewal date if missing
subscriptionSchema.pre("save", function (next) {
    if(!this.renewalDate) {
        const renewalPeriod = {
            daily: 1,
            weekly: 7,
            monthly: 30,
            yearly: 365,
        }

        this.renewalDate = new Date(this.startDate)
        this.renewalDate.setDate(this.renewalDate.getDate() + renewalPeriod[this.frequency])
    }

    // auto update if renewal date is in the past
    if(this.renewalDate < new Date()) {
        this.status = "expired"
    }

    next()
})

const Subscription = mongoose.model("Subscription", subscriptionSchema);

export default Subscription;
