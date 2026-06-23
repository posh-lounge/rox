"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const BlogsMain = () => {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<
    {
      id: number;
      title: string;
      date: string;
      subcategory: string;
      description: string;
      image: string;
    }[]
  >([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Simulate fetched data
      setEvents([
        {
          id: 1,
          title: "B space",
          date: "12 May 2025",
          subcategory: "Upcoming",
          description:
            "Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto ab delectus suscipit beatae ullam a illum numquam magni quod!",
          image: "",
        },
     
      ]);
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full mt-0">
      <div className="bg-white shadow rounded-xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {loading ? <Skeleton width={120} /> : "All Blogs"}
          </h2>
        </div>

        <div className="pt-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(3)
                .fill({})
                .map((_, i) => (
                  <div key={i} className="rounded-xl bg-white shadow p-4">
                    <Skeleton height={192} />
                    <Skeleton className="mt-3" width={100} />
                    <Skeleton className="mt-2" count={3} />
                    <Skeleton className="mt-3" width={90} height={32} />
                  </div>
                ))}
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-16">
              <img
                src="/no-events.svg"
                alt="No Blogs"
                className="w-48 h-48 mb-6"
              />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                No Blogs Found
              </h3>
              <p className="text-sm text-gray-500">
                You don’t have any Blogs  right now.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden"
                >
                  <div className="relative">
                  
                    <div className="h-48 bg-gray-200 flex items-center justify-center">
                      {event.image ? (
                        <img
                          src={event.image}
                          alt={event.title}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <span className="text-gray-400 text-sm">
                          No Image
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">

                    <p className="text-sm text-gray-500 mb-1">{event.date}</p>
                    
                    <p className="text-sm text-gray-500 mb-1">{event.subcategory}</p>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {event.title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-600 line-clamp-3">
                      {event.description}
                    </p>
                    <div className="mt-4">
                      <Link
                        href={`/support/blogs/${event.id}`}
                        className="inline-block text-sm text-blue-600 border border-blue-600 px-4 py-1.5 rounded hover:bg-blue-50 transition"
                      >
                        View detail
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogsMain;
