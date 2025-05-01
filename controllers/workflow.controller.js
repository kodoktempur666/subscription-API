// import dayjs from 'dayjs'
// import { createRequire } from 'module';
// const require = createRequire(import.meta.url);
// const { serve } = require("@upstash/workflow/express");
// import Subscription from '../models/subscription.model.js';
// import { sendReminderEmail } from '../utils/send-email.js'

// const REMINDERS = [7, 5, 2, 1]

// export const sendReminders = serve(async (context) => {
//   const { subscriptionId } = context.requestPayload;
//   const subscription = await fetchSubscription(context, subscriptionId);

//   if(!subscription || subscription.status !== 'active') return;

//   const renewalDate = dayjs(subscription.renewalDate);

//   if(renewalDate.isBefore(dayjs())) {
//     console.log(`Renewal date has passed for subscription ${subscriptionId}. Stopping workflow.`);
//     return;
//   }

//   for (const daysBefore of REMINDERS) {
//     const reminderDate = renewalDate.subtract(daysBefore, 'day');

//     if(reminderDate.isAfter(dayjs())) {
//       await sleepUntilReminder(context, `Reminder ${daysBefore} days before`, reminderDate);
//     }

//     if (dayjs().isSame(reminderDate, 'day')) {
//       await triggerReminder(context, `${daysBefore} days before reminder`, subscription);
//     }
//   }
// });

// const fetchSubscription = async (context, subscriptionId) => {
//   return await context.run('get subscription', async () => {
//     return Subscription.findById(subscriptionId).populate('user', 'name email');
//   })
// }

// const sleepUntilReminder = async (context, label, date) => {
//   console.log(`Sleeping until ${label} reminder at ${date}`);
//   await context.sleepUntil(label, date.toDate());
// }

// const triggerReminder = async (context, label, subscription) => {
//   return await context.run(label, async () => {
//     console.log(`Triggering ${label} reminder`);

//     await sendReminderEmail({
//       to: subscription.user.email,
//       type: label,
//       subscription,
//     })
//   })
// }


import dayjs from 'dayjs'
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { serve } = require("@upstash/workflow/express");
import Subscription from '../models/subscription.model.js';
import { sendReminderEmail } from '../utils/send-email.js'

const REMINDERS = [1];

export const sendReminders = serve(async (context) => {
  const { subscriptionId } = context.requestPayload;
  console.log("Workflow started for subscriptionId:", subscriptionId);

  const subscription = await fetchSubscription(context, subscriptionId);

  if (!subscription) {
    console.log("Subscription not found");
    return;
  }

  if (subscription.status !== 'active') {
    console.log("Subscription is not active:", subscription.status);
    return;
  }

  const renewalDate = dayjs(subscription.renewalDate);
  const now = dayjs();

  if (renewalDate.isBefore(now)) {
    console.log(`Renewal date ${renewalDate.format()} has passed. Workflow stopping.`);
    return;
  }

  for (const daysBefore of REMINDERS) {
    const reminderDate = renewalDate.subtract(daysBefore, 'day');
    const isTodayOrPast = now.isSame(reminderDate, 'day') || now.isAfter(reminderDate);

    console.log({
      daysBefore,
      now: now.format(),
      reminderDate: reminderDate.format(),
      isTodayOrPast
    });

    if (isTodayOrPast) {
      await triggerReminder(context, `${daysBefore} days before reminder`, subscription);
    }
  }

  console.log("All applicable reminders triggered.");
});

const fetchSubscription = async (context, subscriptionId) => {
  return await context.run('get subscription', async () => {
    return Subscription.findById(subscriptionId).populate('user', 'name email');
  });
};

const triggerReminder = async (context, label, subscription) => {
  return await context.run(label, async () => {
    console.log(`Triggering ${label} for ${subscription.name}`);

    await sendReminderEmail({
      to: subscription.user.email,
      type: label,
      subscription,
    });
  });
};
