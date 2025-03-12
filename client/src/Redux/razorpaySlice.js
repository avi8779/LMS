// src/Redux/razorpaySlice.js
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

// ✅ Get Razorpay Key
export const getRazorPayId = createAsyncThunk(
  "/razorPayId/get",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/payments/razorpay-key");
      return res.data;
    } catch (error) {
      toast.error("Failed to load Razorpay key");
      return rejectWithValue(error?.response?.data || error?.message);
    }
  }
);

// ✅ Purchase Course Bundle
export const purchaseCourseBundle = createAsyncThunk(
  "/purchaseCourse",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/payments/subscribe");
      toast.success("Subscription initiated successfully");
      return res.data;
    } catch (error) {
      const errorMessage = error?.response?.data?.message || "Purchase failed";
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

// ✅ Verify Payment
export const verifyUserPayment = createAsyncThunk(
  "/verifyPayment",
  async (paymentDetail, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/payments/verify", paymentDetail);
      toast.success("Payment verified successfully");
      return res.data;
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message || "Verification failed";
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

// ✅ Get Payment Record
export const getPaymentRecord = createAsyncThunk(
  "/paymentRecord",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/payments?count=100");
      toast.success("Payments fetched successfully");
      return res.data;
    } catch (error) {
      toast.error("Failed to fetch payment records");
      return rejectWithValue(error?.response?.data || error?.message);
    }
  }
);

// ✅ Cancel Course Bundle
export const cancelCourseBundle = createAsyncThunk(
  "/cancelCourse",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/payments/unsubscribe");
      toast.success("Subscription cancelled successfully");
      return res.data;
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message || "Failed to cancel subscription";
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

const razorpaySlice = createSlice({
  name: "razorpay",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getRazorPayId.fulfilled, (state, action) => {
        state.key = action.payload.key;
      })
      .addCase(purchaseCourseBundle.fulfilled, (state, action) => {
        state.subscription_id = action.payload.subscription_id;
      })
      .addCase(verifyUserPayment.fulfilled, (state, action) => {
        state.isPaymentVerified = action.payload.success;
      })
      .addCase(getPaymentRecord.fulfilled, (state, action) => {
        state.allPayments = action.payload.allPayments;
        state.finalMonths = action.payload.finalMonths;
        state.monthlySalesRecord = action.payload.monthlySalesRecord;
      })
      .addCase(cancelCourseBundle.fulfilled, (state) => {
        state.subscription_id = "";
      });
  },
});

export default razorpaySlice.reducer;
