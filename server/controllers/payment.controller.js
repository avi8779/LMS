import crypto from 'crypto';

import asyncHandler from '../middlewares/asyncHandler.middleware.js';
import User from '../models/user.model.js';
import AppError from '../utils/AppError.js';
import { razorpay } from '../server.js';
import Payment from '../models/Payment.model.js';

/**
 * @ACTIVATE_SUBSCRIPTION
 * @ROUTE @POST {{URL}}/api/v1/payments/subscribe
 * @ACCESS Private (Logged in user only)
 */
export const buySubscription = asyncHandler(async (req, res, next) => {
  // Extracting ID from request object (authenticated user)
  const { id } = req.user;

  // Finding the user based on the ID
  const user = await User.findById(id);

  if (!user) {
    return next(new AppError('Unauthorized, please login', 401));
  }

  // Checking if the user is an admin
  if (user.role === 'ADMIN') {
    return next(new AppError('Admins cannot purchase a subscription', 400));
  }

  // Creating a subscription using Razorpay that we imported from the server
  const subscription = await razorpay.subscriptions.create({
    plan_id: process.env.RAZORPAY_PLAN_ID, // The unique plan ID
    customer_notify: 1, // Razorpay will handle notifying the customer
    total_count: 12, // Charge every month for 1-year subscription
  });

  // Adding the subscription ID and status to the user account
  user.subscription.id = subscription.id;
  user.subscription.status = subscription.status;

  // Saving the user document with updated subscription details
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Subscribed successfully',
    subscription_id: subscription.id,
  });
});

/**
 * @VERIFY_SUBSCRIPTION
 * @ROUTE @POST {{URL}}/api/v1/payments/verify
 * @ACCESS Private (Logged in user only)
 */
export const verifySubscription = asyncHandler(async (req, res, next) => {
  const { id } = req.user;
  const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body;

  // Finding the user
  const user = await User.findById(id);

  // Getting the subscription ID from the user object
  const subscriptionId = user.subscription.id;

  // Generating a signature with SHA256 for verification purposes
  // Here the subscriptionId should be the one which we saved in the DB
  // razorpay_payment_id is from the frontend and there should be a '|' character between this and subscriptionId
  // At the end convert it to Hex value
  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_SECRET)
    .update(`${razorpay_payment_id}|${subscriptionId}`)
    .digest('hex');

  // Check if generated signature and signature received from the frontend is the same or not
  if (generatedSignature !== razorpay_signature) {
    return next(new AppError('Payment not verified, please try again.', 400));
  }

  // If they match create payment and store it in the DB
  await Payment.create({
    razorpay_payment_id,
    razorpay_subscription_id,
    razorpay_signature,
  });

  // Update the user subscription status to active (This will be created before this)
  user.subscription.status = 'active';

  // Save the user in the DB with any changes
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Payment verified successfully',
  });
});



/**
 * @CANCEL_SUBSCRIPTION
 * @ROUTE @POST {{URL}}/api/v1/payments/unsubscribe
 * @ACCESS Private (Logged in user only)
 */
export const cancelSubscription = asyncHandler(async (req, res, next) => {
  const { id } = req.user;
  // console.log(req.user);

  // Finding the user
  const user = await User.findById(id);
  // console.log(user);

  // Checking the user role
  if (user.role === 'ADMIN') {
    return next(
      new AppError('Admin cannot cancel subscription', 400)
    );
  }

  // Finding subscription ID from subscription object
  const subscriptionId = user.subscription.id;

  // Canceling the subscription using Razorpay
  try {
    const subscription = await razorpay.subscriptions.cancel(subscriptionId); // Razorpay API to cancel subscription

    // Updating the user subscription status
    user.subscription.status = subscription.status;

    // Saving the user object with updated subscription status
    await user.save();
  } catch (error) {
    // Returning error if any (error is from Razorpay)
    return next(new AppError(error.error.description, error.statusCode));
  }

  // Finding the payment using the subscription ID
  const payment = await Payment.findOne({
    razorpay_subscription_id: subscriptionId,
  });

  // Calculating time since the payment was made (in milliseconds)
  const timeSinceSubscribed = Date.now() - payment.createdAt;

  // Refund period (14 days)
  const refundPeriod = 14 * 24 * 60 * 60 * 1000;

  // Check if refund period has expired
  if (refundPeriod <= timeSinceSubscribed) {
    return next(
      new AppError(
        'Refund period is over, no refunds will be provided.',
        400
      )
    );
  }

  // If refund period is valid, refund the full amount that the user has paid
  await razorpay.payments.refund(payment.razorpay_payment_id, {
    speed: 'optimum', // Required for the refund
  });

  // Clearing subscription details from user document
  user.subscription.id = undefined;
  user.subscription.status = undefined;

  // Saving updated user document
  await user.save();
  await payment.remove();

  // Sending the response
  res.status(200).json({
    success: true,
    message: 'Subscription canceled and refunded successfully',
  });
});

/**
 * @GET_RAZORPAY_ID
 * @ROUTE @POST {{URL}}/api/v1/payments/razorpay-key
 * @ACCESS Public
 */
export const getRazorpayApiKey = asyncHandler(async (_req, res, _next) => {
  res.status(200).json({
    success: true,
    message: 'Razorpay API key retrieved successfully',
    key: process.env.RAZORPAY_KEY_ID,
  });
});

/**
 * @GET_RAZORPAY_PAYMENTS
 * @ROUTE @GET {{URL}}/api/v1/payments
 * @ACCESS Private (ADMIN only)
 */
export const allPayments = asyncHandler(async (req, res, _next) => {
  const { count, skip } = req.query;

  // Fetching all subscriptions from Razorpay
  const allPayments = await razorpay.subscriptions.all({
    count: count || 10, // Default to 10 if not provided
    skip: skip || 0,    // Default to 0 if not provided
  });

  // Processing monthly payments statistics
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December',
  ];

  const finalMonths = monthNames.reduce((acc, month) => {
    acc[month] = 0;
    return acc;
  }, {});

  const monthlyWisePayments = allPayments.items.map((payment) => {
    const monthsInNumbers = new Date(payment.start_at * 1000);
    return monthNames[monthsInNumbers.getMonth()];
  });

  monthlyWisePayments.forEach((month) => {
    finalMonths[month]++;
  });

  const monthlySalesRecord = Object.values(finalMonths);

  res.status(200).json({
    success: true,
    message: 'All payments fetched successfully',
    allPayments,
    finalMonths,
    monthlySalesRecord,
  });
});
