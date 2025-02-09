import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { toast } from "react-hot-toast";
import axiosInstance from "../Helper/axiosInstance";

const initialState = {
  key: "",
  subscription_id: "",
  isPaymentVerified: false,
  allPayments: {},
  finalMonths: {},
  monthlySalesRecord: [],
};

// function to get the api key
export const getRazorPayId = createAsyncThunk("/razorPayId/get", async () => {
  try {
    const res = await axiosInstance.get("/payments/razorpay-key");
    return res.data;
  } catch (error) {
    toast.error("Failed to load data");
  }
});

// function to purchase the course bundle
export const purchaseCourseBundle = createAsyncThunk(
  "/purchaseCourse",
  async () => {
    try {
      const res = await axiosInstance.post("/payments/subscribe");
      return res.data;
    } catch (error) {
      toast.error(error?.response?.data?.message);
    }
  }
);

// function to verify the user payment
export const verifyUserPayment = createAsyncThunk(
  "/verifyPayment",
  async (paymentDetail, { rejectWithValue }) => {
    try {
      // Sending payment verification request to the server
      const res = await axiosInstance.post("/payments/verify", {
        razorpay_payment_id: paymentDetail.razorpay_payment_id,
        razorpay_subscription_id: paymentDetail.razorpay_subscription_id,
        razorpay_signature: paymentDetail.razorpay_signature,
      });
      return res?.data; // Returning the response data to be handled in the reducer
    } catch (error) {
      // Handling errors and showing the error message using toast
      if (error?.response?.data?.message) {
        toast.error(error?.response?.data?.message);
      } else {
        toast.error("Something went wrong. Please try again.");
      }
      
      // Optional: Return the error message as rejected value for handling in the reducer
      return rejectWithValue(error?.response?.data || error?.message || "Unknown error");
    }
  }
);

// function to get all the payment record
export const getPaymentRecord = createAsyncThunk("paymentrecord", async () => {
  try {
    const res = axiosInstance.get("/payments?count=100");
    toast.promise(res, {
      loading: "Getting the payments record...",
      success: (data) => {
        return data?.data?.message;
      },
      error: "Failed to get payment records",
    });

    const response = await res;
    return response.data;
  } catch (error) {
    toast.error("Operation failed");
  }
});

// function to cancel the course bundle subscription
export const cancelCourseBundle = createAsyncThunk(
  "/cancelCourse",
  async (_, { rejectWithValue }) => {
    try {
      const res = axiosInstance.post("/payments/unsubscribe");

      await toast.promise(res, {
        loading: "Unsubscribing the bundle...",
        success: "Bundle unsubscribed successfully",
        error: "Failed to unsubscribe the bundle",
      });

      const response = await res;
      return response.data;
    } catch (error) {
      const errorMessage = error?.response?.data?.message || "An error occurred";

      if (errorMessage.includes("PRO FEATURE ONLY")) {
        toast.error("This feature is available for premium users only.");
      } else {
        toast.error(errorMessage);
      }

      return rejectWithValue(error?.response?.data);
    }
  }
);





const razorpaySlice = createSlice({
  name: "razorpay",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getRazorPayId.rejected, () => {
        toast.error("Failed to get razor pay id");
      })
      .addCase(getRazorPayId.fulfilled, (state, action) => {
        state.key = action?.payload?.key;
      })
      .addCase(purchaseCourseBundle.fulfilled, (state, action) => {
        state.subscription_id = action?.payload?.subscription_id;
      })
      .addCase(verifyUserPayment.fulfilled, (state, action) => {
        toast.success(action?.payload?.message);
        state.isPaymentVerified = action?.payload?.success;
      })
      .addCase(verifyUserPayment.rejected, (state, action) => {
        toast.error(action?.payload?.message);
        state.isPaymentVerified = action?.payload?.success;
      })
      .addCase(getPaymentRecord.fulfilled, (state, action) => {
        state.allPayments = action?.payload?.allPayments;
        state.finalMonths = action?.payload?.finalMonths;
        state.monthlySalesRecord = action?.payload?.monthlySalesRecord;
      });
  },
});

export const {} = razorpaySlice.actions;
export default razorpaySlice.reducer;
