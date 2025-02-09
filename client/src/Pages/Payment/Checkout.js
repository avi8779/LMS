import React, { useEffect, useState } from "react";
import Layout from "../../Layout/Layout";
import { BiRupee } from "react-icons/bi";
import { useDispatch, useSelector } from "react-redux";
import {
  getRazorPayId,
  purchaseCourseBundle,
  verifyUserPayment,
} from "../../Redux/razorpaySlice";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const razorPayKey = useSelector((state) => state.razorpay.key);
  const subscription_id = useSelector(
    (state) => state.razorpay.subscription_id
  );
  const userData = useSelector((state) => state.auth.data);
  const [loading, setLoading] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    razorpay_payment_id: "",
    razorpay_subscription_id: "",
    razorpay_signature: "",
  });

  const handleSubscription = async (event) => {
    event.preventDefault();

    if (!razorPayKey || !subscription_id) {
      toast.error("Payment credentials are missing. Please try again.");
      return;
    }

    if (!window.Razorpay) {
      toast.error("Razorpay SDK is not loaded. Please refresh the page.");
      return;
    }

    const options = {
      key: razorPayKey,
      subscription_id,
      name: "Coursify Pvt. Ltd.",
      description: "Monthly Subscription",
      handler: async (response) => {
        setPaymentDetails({
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_subscription_id: response.razorpay_subscription_id,
          razorpay_signature: response.razorpay_signature,
        });

        toast.success("Payment Successful");
        setLoading(true);

        try {
          const res = await dispatch(verifyUserPayment(response)).unwrap();
          if (res.success) {
            navigate("/checkout/success");
          } else {
            throw new Error(res.message || "Payment verification failed.");
          }
        } catch (error) {
          toast.error(error.message || "Payment verification failed.");
          navigate("/checkout/fail");
        } finally {
          setLoading(false);
        }
      },
      prefill: {
        name: userData?.fullName || "Guest User",
        email: userData?.email || "guest@example.com",
      },
      theme: {
        color: "#F37254",
      },
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
  };

  useEffect(() => {
    const fetchRazorpayData = async () => {
      try {
        await dispatch(getRazorPayId()).unwrap();
        await dispatch(purchaseCourseBundle()).unwrap();
      } catch (error) {
        toast.error(error.message || "Failed to load payment data.");
      }
    };

    fetchRazorpayData();
  }, [dispatch]);

  return (
    <Layout>
      <form
        onSubmit={handleSubscription}
        className="min-h-[90vh] flex items-center justify-center text-white"
      >
        <div className="w-80 h-[26rem] flex flex-col justify-center shadow-[0_0_10px_black] rounded-lg relative">
          <h1 className="bg-yellow-500 absolute top-0 w-full text-center py-4 text-2xl font-bold rounded-tl-lg rounded-tr-lg">
            Subscription Bundle
          </h1>

          <div className="px-4 space-y-5 text-center">
            <p className="text-[17px]">
              This purchase will allow you to access all the available courses
              of our platform for{" "}
              <span className="text-yellow-500 font-bold">1 Year Duration</span>
              . <br />
              All the existing and new launched courses will be available to you
              in this subscription bundle.
            </p>

            <p className="flex items-center justify-center gap-1 text-2xl font-bold text-yellow-500">
              <BiRupee /> <span>499</span> only
            </p>

            <div className="text-gray-200">
              <p>100% refund at cancellation</p>
              <p>* Terms & Conditions Apply</p>
            </div>
          </div>

          <button
            type="submit"
            className="bg-yellow-500 hover:bg-yellow-600 transition-all ease-in-out duration-300 absolute bottom-0 w-full text-center py-2 text-xl font-bold rounded-bl-lg rounded-br-lg"
            disabled={loading}
          >
            {loading ? "Processing..." : "Buy Now"}
          </button>
        </div>
      </form>
    </Layout>
  );
};

export default Checkout;
