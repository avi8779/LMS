import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import Layout from "../../Layout/Layout";
import {
  deleteCourseLecture,
  getCourseLecture,
  markLectureAsWatched, // Import action to mark as watched
} from "../../Redux/lectureSlice";

const DisplayLectures = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const courseDetails = useLocation().state;
  const { lectures } = useSelector((state) => state.lecture);
  const { role, user } = useSelector((state) => state.auth); // Get user details

  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [watchedLectures, setWatchedLectures] = useState({}); // Track watched lectures

  useEffect(() => {
    (async () => {
      await dispatch(getCourseLecture(courseDetails._id));
    })();
  }, []);

  // Handle lecture delete
  const handleLectureDelete = async (courseId, lectureId) => {
    const data = { courseId, lectureId };
    await dispatch(deleteCourseLecture(data));
    await dispatch(getCourseLecture(courseDetails._id));
  };

  // Handle marking lecture as watched
  const handleVideoEnd = async (lectureId) => {
    setWatchedLectures((prev) => ({ ...prev, [lectureId]: true }));

    // Dispatch action to update the database
    await dispatch(markLectureAsWatched({ userId: user._id, lectureId }));
  };

  return (
    <Layout>
      <div className="flex flex-col gap-10 items-center justify-center min-h-[90vh] py-10 text-white mx-[5%]">
        <h1 className="text-center text-2xl font-semibold text-yellow-500">
          Course Name: {courseDetails?.title}
        </h1>

        <div className="flex justify-center gap-10 w-full">
          {/* Video Player */}
          <div className="space-y-5 w-[28rem] p-2 rounded-lg shadow-[0_0_10px_black]">
            <video
              className="object-fill rounded-tl-lg rounded-tr-lg w-full"
              src={lectures && lectures[currentVideoIndex]?.lecture?.secure_url}
              controls
              disablePictureInPicture
              muted
              controlsList="nodownload"
              onEnded={() => handleVideoEnd(lectures[currentVideoIndex]?._id)} // Mark as watched
            ></video>
            <div>
              <h1>
                <span className="text-yellow-500">Title: </span>
                {lectures && lectures[currentVideoIndex]?.title}
              </h1>
              <p>
                <span className="text-yellow-500">Description: </span>
                {lectures && lectures[currentVideoIndex]?.description}
              </p>
            </div>
          </div>

          {/* Lecture List */}
          <ul className="w-[28rem] p-2 rounded-lg shadow-[0_0_10px_black] space-y-4">
            <li className="font-semibold text-xl text-yellow-500 flex items-center justify-between">
              <p>Lectures List</p>
              {role === "ADMIN" && (
                <button
                  onClick={() =>
                    navigate("/course/addlecture", {
                      state: { ...courseDetails },
                    })
                  }
                  className="btn-primary px-2 py-1 rounded-md font-semibold text-sm"
                >
                  Add New Lecture
                </button>
              )}
            </li>
            {lectures &&
              lectures.map((element, index) => {
                return (
                  <li className="space-y-2 flex justify-between" key={element._id}>
                    <p
                      className="cursor-pointer"
                      onClick={() => setCurrentVideoIndex(index)}
                    >
                      <span className="text-yellow-500">
                        Lecture {index + 1}:{" "}
                      </span>
                      {element?.title}
                    </p>
                    {watchedLectures[element._id] && (
                      <span className="text-green-400 font-bold">✔ Watched</span>
                    )}
                    {role === "ADMIN" && (
                      <button
                        onClick={() =>
                          handleLectureDelete(courseDetails?._id, element?._id)
                        }
                        className="btn-primary px-2 py-1 rounded-md font-semibold text-sm"
                      >
                        Delete
                      </button>
                    )}
                  </li>
                );
              })}
          </ul>
        </div>
      </div>
    </Layout>
  );
};

export default DisplayLectures;
