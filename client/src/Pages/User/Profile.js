import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import Layout from "../../Layout/Layout";
import {
  cancelCourseBundle,
  getPaymentRecord,
} from "../../Redux/razorpaySlice";
import { getUserData } from "../../Redux/authSlice";
import { toast } from "react-hot-toast"; // Import toast from react-hot-toast

const Profile = () => {
  const dispatch = useDispatch();

  const userData = useSelector((state) => state.auth.data);

  // ✅ Cancel subscription handler
  const handleCourseCancelSubscription = async () => {
    try {
      const result = await dispatch(cancelCourseBundle()).unwrap();
      if (result) {
        dispatch(getUserData());
        dispatch(getPaymentRecord());

        // Notify user about successful cancellation
        toast.success("Subscription successfully canceled. Payment will be refunded in 3-4 working days.");
      }
    } catch (error) {
      console.error("Cancellation failed:", error);
      if (error?.message) {
        toast.error(error.message);
      } else {
        toast.error("Failed to cancel subscription. Try again later.");
      }
    }
  };

  useEffect(() => {
    dispatch(getUserData());
  }, [dispatch]);

  return (
    <Layout>
      <div className="min-h-[90vh] flex items-center justify-center">
        <div className="my-10 flex flex-col gap-4 rounded-lg p-4 text-white w-80 shadow-[0_0_10px_black]">
          {/* ✅ Profile Picture */}
          <img
            className="w-40 m-auto rounded-full border border-black"
            src={userData?.avatar?.secure_url}
            alt="User Profile"
          />

          {/* ✅ Name */}
          <h3 className="text-xl font-semibold text-center capitalize">
            {userData?.fullName}
          </h3>

          {/* ✅ User Details */}
          <div className="grid grid-cols-2">
            <p>Email:</p>
            <p>{userData?.email}</p>
            <p>Role:</p>
            <p>{userData?.role}</p>
            <p>Subscription:</p>
            <p>
              {userData?.subscription?.status === "active"
                ? "Active"
                : "Inactive"}
            </p>
          </div>

          {/* ✅ Action Buttons */}
          <div className="flex items-center justify-between gap-2">
            {/* 🔑 Change Password Button */}
            <Link
              to={
                userData?.email === "test@gmail.com"
                  ? "/denied"
                  : "/changepassword"
              }
              className="w-1/2 bg-yellow-600 hover:bg-yellow-700 transition-all rounded-sm py-2 font-semibold text-center"
            >
              Change Password
            </Link>

            {/* ✏️ Edit Profile Button */}
            <Link
              to={
                userData?.email === "test@gmail.com"
                  ? "/denied"
                  : "/user/editprofile"
              }
              className="w-1/2 border border-yellow-600 hover:border-yellow-500 transition-all rounded-sm py-2 font-semibold text-center"
            >
              Edit Profile
            </Link>
          </div>

          {/* ❌ Cancel Subscription Button */}
          {userData?.subscription?.status === "active" && (
            <button
              onClick={handleCourseCancelSubscription}
              className="w-full bg-red-600 hover:bg-red-500 transition-all rounded-sm py-2 font-semibold"
            >
              Cancel Subscription
            </button>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
