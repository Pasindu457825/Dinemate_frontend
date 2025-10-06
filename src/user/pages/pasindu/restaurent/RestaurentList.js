import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card, CardHeader, CardBody, Typography, Avatar
} from "@material-tailwind/react";
import api from "../../../../api"; // ✅ use the shared axios instance

const RestaurantsList = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        // If your route returns all on GET '/', use this:
        // const { data } = await api.get("/api/ITPM/restaurants");

        // If your backend expects '/get-all-restaurants', use this:
        const { data } = await api.get("/api/ITPM/restaurants/get-all-restaurants");

        const enabled = Array.isArray(data)
          ? data.filter(r => r.isEnabled)
          : [];

        setRestaurants(enabled);
      } catch (err) {
        console.error("Error fetching restaurants:", err);
      }
    };

    fetchRestaurants();
  }, []);

  const filtered = restaurants.filter(r =>
    (r.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const BackgroundBlogCard = ({ image, title, subtitle, avatar, onClick }) => (
    <Card
      shadow={false}
      className="relative grid h-[28rem] w-full max-w-[20rem] items-end justify-center overflow-hidden text-center cursor-pointer"
      onClick={onClick}
    >
      <CardHeader
        floated={false}
        shadow={false}
        color="transparent"
        style={{ backgroundImage: `url(${image})`, backgroundSize: "cover", backgroundPosition: "center" }}
        className="absolute inset-0 m-0 h-full w-full rounded-none"
      >
        <div className="absolute inset-0 h-full w-full bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
      </CardHeader>
      <CardBody className="relative py-14 px-6 md:px-12">
        <Typography variant="h3" color="white" className="mb-2 font-semibold leading-snug">
          {title}
        </Typography>
        <Typography variant="h7" className="mb-4 text-gray-300">
          {subtitle}
        </Typography>
        <Avatar
          size="xl"
          variant="circular"
          alt={title}
          className="border-2 border-white mx-auto"
          src={avatar}
        />
      </CardBody>
    </Card>
  );

  return (
    <div className="bg-gray-200 pt-6 px-20">
      <h1 className="text-5xl font-bold text-gray-800 mb-6 text-center" style={{ fontFamily: "'Dancing Script', cursive" }}>
        Restaurants List
      </h1>

      <div className="flex justify-start py-4">
        <div className="relative w-full md:w-1/4">
          <input
            type="text"
            placeholder="Search restaurant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 transition pr-10"
          />
          {searchQuery && (
            <span
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-500 hover:text-red-500 text-xl"
            >
              ✖
            </span>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500 text-center">No restaurants found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {filtered.map((restaurant) => (
            <BackgroundBlogCard
              key={restaurant._id}
              image={restaurant.image || "https://via.placeholder.com/300"}
              title={restaurant.name}
              subtitle={restaurant.location}
              avatar={
                restaurant.image ||
                "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=1480&q=80"
              }
              onClick={() => navigate(`/user/restaurent-details/${restaurant._id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RestaurantsList;
