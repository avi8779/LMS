import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import Layout from "../../Layout/Layout";

const CourseDescription = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  // Get user data from Redux store
  const { role, data } = useSelector((state) => state.auth);
  const subscription = data?.subscription; // Extract subscription info safely

  useEffect(() => {
    // Scroll to the top on page render
    window.scrollTo(0, 0);
  }, []);

  return (
    <Layout>
      <div className="min-h-[90vh] pt-12 px-20 flex flex-col items-center justify-center text-white">
        <div className="grid grid-cols-2 gap-10 py-10 relative">
          {/* Left side: Course thumbnail and details */}
          <div className="space-y-5">
            <img
              className="w-full h-64"
              src={state?.thumbnail?.secure_url}
              alt="thumbnail"
            />

            {/* Course details */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xl">
                <p className="font-semibold">
                  <span className="text-yellow-500 font-bold">
                    Total Lectures:{" "}
                  </span>
                  {state.numberOfLectures}
                </p>
                <p className="font-semibold">
                  <span className="text-yellow-500 font-bold">Instructor: </span>
                  {state.createdBy}
                </p>
              </div>

              {/* Subscribe or Watch Lectures Button */}
              {role === "ADMIN" || subscription?.status === "active" || subscription?.status === "created" ? (
                <button
                  onClick={() =>
                    navigate("/course/displaylectures", { state: { ...state } })
                  }
                  className="bg-yellow-600 text-xl rounded-md font-bold px-5 py-3 w-full hover:bg-yellow-500 transition-all ease-in-out duration-300"
                >
                  Watch Lectures
                </button>
              ) : (
                <button
                  onClick={() => navigate("/checkout")}
                  className="bg-yellow-600 text-xl rounded-md font-bold px-5 py-3 w-full hover:bg-yellow-500 transition-all ease-in-out duration-300"
                >
                  Subscribe to Course
                </button>
              )}
            </div>
          </div>

          {/* Right side: Course title and description */}
          <div className="space-y-2 text-xl">
            <h1 className="text-3xl font-bold text-yellow-500 text-center mb-4">
              {state.title}
            </h1>
            <p className="text-yellow-500 font-bold">Course Description:</p>
            <p>{state.description}</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CourseDescription;
