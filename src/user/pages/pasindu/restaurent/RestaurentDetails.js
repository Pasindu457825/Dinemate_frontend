import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import CartSidebar from "../order/CartPage";
import {
  Card, CardHeader, CardBody, CardFooter, Typography, Button,
} from "@material-tailwind/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShoppingCart } from "@fortawesome/free-solid-svg-icons";
import { motion, AnimatePresence } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";
import api from "../../../../api"; // ✅ use the configured axios instance

const RestaurantDetails = () => {
  const { id: restaurantId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { reservationId } = location.state || {};

  const [restaurant, setRestaurant] = useState(null);
  const [foods, setFoods] = useState([]);
  const [categorizedFoods, setCategorizedFoods] = useState({});
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

  const [quantities, setQuantities] = useState({});
  const [selectedPortionSizes, setSelectedPortionSizes] = useState({});
  const [orderType, setOrderType] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Load cart once
  useEffect(() => {
    setCart(JSON.parse(localStorage.getItem("cart")) || []);
  }, []);

  // Fetch restaurant + foods
  useEffect(() => {
    const fetchRestaurantAndFoods = async () => {
      try {
        setLoading(true);

        const [restaurantRes, foodsRes] = await Promise.all([
          api.get(`/api/ITPM/restaurants/get-restaurant/${restaurantId}`),
          api.get(`/api/ITPM/foodItems/restaurant/foods/${restaurantId}`),
        ]);

        setRestaurant(restaurantRes.data);

        // Normalize foods payload
        const list =
          (Array.isArray(foodsRes.data) && foodsRes.data) ||
          foodsRes.data?.foods ||
          foodsRes.data?.data ||
          foodsRes.data?.items ||
          [];

        setFoods(list);

        // Build categories
        const byCat = list.reduce((acc, f) => {
          const key = (f.category || "Uncategorized").trim();
          acc[key] = acc[key] || [];
          acc[key].push(f);
          return acc;
        }, {});
        setCategorizedFoods(byCat);
      } catch (error) {
        console.error("Error fetching data:", {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        });
        toast.error("Failed to load restaurant or menu.");
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantAndFoods();
  }, [restaurantId]);

  const handleQuantityChange = (foodId, increment) => {
    setQuantities((prev) => ({
      ...prev,
      [foodId]: Math.max(1, (prev[foodId] || 1) + increment),
    }));
  };

  const handleAddToCart = (food) => {
    if (!orderType) {
      toast.warn("⚠️ Please select an order type first!");
      return;
    }

    if (food.availability && food.availability !== "Available") {
      toast.error("❌ This item is currently unavailable.");
      return;
    }

    const quantity = quantities[food._id] || 1;
    const portionSize = selectedPortionSizes[food._id] || "Medium";
    const basePrice = parseFloat(food.price) || 0;
    const finalPrice = portionSize === "Large" ? basePrice * 1.5 : basePrice;

    let storedCart = JSON.parse(localStorage.getItem("cart")) || [];

    const addItemToCart = () => {
      const idx = storedCart.findIndex(
        (i) => i._id === food._id && i.portionSize === portionSize
      );
      let updated;
      if (idx !== -1) {
        updated = storedCart.map((i, k) =>
          k === idx ? { ...i, quantity: i.quantity + quantity } : i
        );
      } else {
        updated = [
          ...storedCart,
          {
            ...food,
            quantity,
            portionSize,
            price: finalPrice,
            restaurantId,
            orderType,
          },
        ];
      }
      setCart(updated);
      localStorage.setItem("cart", JSON.stringify(updated));
      toast.success(`✅ Added "${food.name}" (${portionSize}) to the cart!`);
    };

    if (storedCart.length > 0 && storedCart[0].restaurantId !== restaurantId) {
      Swal.fire({
        title: "Switch Restaurant?",
        text:
          "You already have items from another restaurant. Clear the cart and add items from this one?",
        icon: "warning",
        showDenyButton: true,
        confirmButtonColor: "#d33",
        denyButtonColor: "#3085d6",
        confirmButtonText: "Yes, clear it",
        denyButtonText: "No",
      }).then((result) => {
        if (result.isConfirmed) {
          storedCart = [];
          setCart([]);
          localStorage.setItem("cart", JSON.stringify([]));
          toast.info("Cart cleared, adding new items.");
          addItemToCart();
        } else {
          Swal.fire({
            icon: "info",
            title: "Action Cancelled",
            text: "Cart was not modified.",
            timer: 1500,
            showConfirmButton: false,
          });
        }
      });
      return;
    }

    addItemToCart();
  };

  if (loading) return <p className="text-center text-gray-500">Loading...</p>;
  if (!restaurant) return <p className="text-center text-gray-500">Not found</p>;

  return (
    <>
      <div className="bg-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left: Restaurant Details */}
          <div className="md:w-1/5 bg-white shadow-2xl rounded-2xl p-6 flex flex-col items-start self-start">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">{restaurant.name}</h1>

            <img
              src={restaurant.image || "https://via.placeholder.com/600"}
              alt={restaurant.name}
              onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/600")}
              className="w-full h-64 object-cover rounded-xl shadow-lg"
            />

            <div className="mt-6 w-full space-y-4">
              {!!restaurant.description && (
                <p className="text-gray-700 text-md leading-relaxed">{restaurant.description}</p>
              )}
              {!!restaurant.location && (
                <p className="text-lg text-gray-700 font-medium flex items-start">
                  <span className="text-pink-600 text-xl mr-2">📍</span>
                  <strong>Location:</strong>
                  <span className="ml-1 flex-1">{restaurant.location}</span>
                </p>
              )}
              {!!restaurant.phoneNumber && (
                <p className="text-lg text-gray-700 font-medium flex items-start">
                  <span className="text-pink-600 text-xl mr-2">☎️</span>
                  <strong>Phone:</strong>
                  <span className="ml-1 flex-1">{restaurant.phoneNumber}</span>
                </p>
              )}
            </div>

            <button
              onClick={() =>
                navigate(`/add-reservation/${restaurantId}`, {
                  state: {
                    restaurantId,
                    name: restaurant.name,
                    numberOfTables: restaurant.numberOfTables,
                    seatsPerTable: restaurant.seatsPerTable,
                  },
                })
              }
              className="mt-6 w-full bg-amber-700 text-white py-3 rounded-xl text-lg font-semibold shadow-md hover:bg-amber-800 transition hover:shadow-lg"
            >
              📅 Book Table
            </button>

            {reservationId && (
              <p className="text-lg font-semibold text-amber-700 mt-4 bg-amber-100 py-2 px-4 rounded-lg shadow-md">
                ✅ Your Reservation ID: {reservationId}
              </p>
            )}
          </div>

          {/* Right: Menu */}
          <div className="md:w-5/6 relative min-h-screen">
            {/* Cart button */}
            {!cartOpen && (
              <div className="fixed top-[90px] right-4 z-50">
                <button
                  onClick={() => setCartOpen(true)}
                  className="bg-amber-700 text-black w-12 h-12 flex items-center justify-center text-sm font-semibold rounded-full shadow-lg hover:bg-amber-900 transition border border-white"
                >
                  <FontAwesomeIcon icon={faShoppingCart} className="text-black w-5 h-5" />
                </button>
              </div>
            )}

            <h2
              className="text-5xl font-bold text-gray-800 mt-4 mb-4"
              style={{ fontFamily: "'Dancing Script', cursive" }}
            >
              Our Food Menu
            </h2>

            {/* Order type + search */}
            <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-6 mr-8 ml-8">
              <div className="flex items-center gap-4 w-full md:w-1/3">
                <label className="text-xl font-bold whitespace-nowrap">Order Type:</label>
                <div className="relative w-40">
                  <div className="relative flex items-center bg-gray-400 rounded-full p-1 cursor-pointer overflow-hidden">
                    {orderType && (
                      <div
                        className={`absolute top-1 bottom-1 w-1/2 bg-amber-700 rounded-full transition-all duration-300 ${
                          orderType === "Dine-in" ? "left-0" : "left-1/2"
                        }`}
                      />
                    )}
                    <div
                      className={`w-1/2 text-center py-2 z-10 transition-all duration-300 ${
                        orderType === "Dine-in" ? "text-white" : "text-gray-800"
                      }`}
                      onClick={() => setOrderType("Dine-in")}
                    >
                      Dine-in
                    </div>
                    <div
                      className={`w-1/2 text-center py-2 z-10 transition-all duration-300 ${
                        orderType === "Takeaway" ? "text-white" : "text-gray-800"
                      }`}
                      onClick={() => setOrderType("Takeaway")}
                    >
                      Takeaway
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative w-full md:w-1/3 mr-6">
                <input
                  type="text"
                  placeholder="Search food..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full p-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 transition pr-10"
                />
                {searchQuery && (
                  <span
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-red-500 text-xl"
                  >
                    ✖
                  </span>
                )}
              </div>
            </div>

            {/* Category chips */}
            <div className="flex items-center justify-center gap-1 mt-6 font-sans">
              <button
                onClick={() => setSelectedCategory("All")}
                className={`w-20 py-1 text-lg rounded-full transition duration-200 font-medium ${
                  selectedCategory === "All"
                    ? "bg-blue-gray-900 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                All
              </button>

              {Object.keys(categorizedFoods || {}).map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`w-24 py-1 text-lg rounded-full transition duration-200 font-medium ${
                    selectedCategory === category
                      ? "bg-blue-gray-900 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>

            {/* Menu grid */}
            <AnimatePresence mode="wait">
              <motion.ul
                key={selectedCategory}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="bg-gray-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-6 pl-6"
              >
                {foods
                  .filter(
                    (food) =>
                      (selectedCategory === "All" || food.category === selectedCategory) &&
                      (food.name || "")
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase())
                  )
                  .map((food) => (
                    <motion.li
                      key={food._id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="w-full max-w-[24rem]"
                    >
                      <Card className="max-w-[20rem] overflow-hidden shadow-lg bg-blue-gray-900 flex flex-col group">
                        <CardHeader
                          floated={false}
                          shadow={false}
                          color="transparent"
                          className="m-0 rounded-none w-full h-40 transition-transform transform group-hover:scale-105"
                        >
                          <img
                            src={food.image || "https://via.placeholder.com/400x250"}
                            onError={(e) =>
                              (e.currentTarget.src = "https://via.placeholder.com/400x250")
                            }
                            alt={food.name}
                            className="h-full w-full object-cover rounded-bl-[20%]"
                          />
                        </CardHeader>

                        <CardBody>
                          <Typography variant="h4" color="white" className="mt-3 font-bold">
                            {food.name}
                          </Typography>
                          <Typography variant="h6" color="white" className="mt-3 font-normal">
                            {food.description}
                          </Typography>

                          {/* Portion sizes */}
                          <div className="mt-4">
                            <label className="text-white text-sm font-semibold">
                              Portion Size:
                            </label>
                            <div className="flex gap-2 mt-1">
                              <button
                                onClick={() =>
                                  setSelectedPortionSizes((prev) => ({
                                    ...prev,
                                    [food._id]: "Medium",
                                  }))
                                }
                                className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-medium transition border-2 ${
                                  selectedPortionSizes[food._id] === "Medium" ||
                                  !selectedPortionSizes[food._id]
                                    ? "bg-amber-700 text-white border-amber-700"
                                    : "bg-gray-300 text-gray-800 border-gray-400 hover:bg-gray-400"
                                }`}
                              >
                                M
                              </button>
                              <button
                                onClick={() =>
                                  setSelectedPortionSizes((prev) => ({
                                    ...prev,
                                    [food._id]: "Large",
                                  }))
                                }
                                className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-medium transition border-2 ${
                                  selectedPortionSizes[food._id] === "Large"
                                    ? "bg-amber-700 text-white border-amber-700"
                                    : "bg-gray-300 text-gray-800 border-gray-400 hover:bg-gray-400"
                                }`}
                              >
                                L
                              </button>
                            </div>
                          </div>
                        </CardBody>

                        <CardFooter className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-white font-medium">
                            <span>Rs.</span>
                            <span>
                              {(
                                (selectedPortionSizes[food._id] === "Large"
                                  ? (parseFloat(food.price) || 0) * 1.5
                                  : parseFloat(food.price) || 0
                                ).toFixed(2)
                              )}
                            </span>
                          </div>

                          {food.availability && food.availability !== "Available" ? (
                            <div className="flex items-center gap-1 text-red-400 font-semibold p-3">
                              <span>❌</span>
                              <span>Unavailable</span>
                            </div>
                          ) : (
                            <Button
                              onClick={() => handleAddToCart(food)}
                              ripple={false}
                              className="bg-amber-700 text-white shadow-none hover:scale-105 focus:scale-105 active:scale-100 rounded-full w-12 h-12 flex items-center justify-center"
                            >
                              <FontAwesomeIcon icon={faShoppingCart} className="w-5 h-5 text-white" />
                            </Button>
                          )}
                        </CardFooter>
                      </Card>
                    </motion.li>
                  ))}
              </motion.ul>
            </AnimatePresence>
          </div>
        </div>

        <CartSidebar
          cartOpen={cartOpen}
          setCartOpen={setCartOpen}
          cart={cart}
          setCart={setCart}
          orderType={orderType}
          reservationId={reservationId}
        />

        <ToastContainer position="top-right" autoClose={3000} newestOnTop pauseOnHover />
      </div>
    </>
  );
};

export default RestaurantDetails;
