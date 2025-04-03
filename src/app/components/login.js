import React from "react";

const Login = ({ setUserId }) => {
  const connect = (e) => {
    e.preventDefault();
    setUserId(e.target.userId.value);
  };
  return (
    <form onSubmit={connect}>
      <div className="bg-gray-100 rounded-md px-12 py-14 flex flex-col space-y-4 w-96">
        <div className="font-semibold text-2xl text-center">
          Authenticate with Sendbird
        </div>
        <div>
          <label
            htmlFor="userId"
            className="block text-sm font-medium leading-6 text-gray-900"
          >
            User ID
          </label>
          <div className="mt-2">
            <div className="flex rounded-md shadow-sm border border-gray-300 focus-within:border-indigo-600">
              <input
                type="text"
                id="userId"
                name="userId"
                className="block flex-1 border-0 bg-transparent py-1.5 pl-1 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                placeholder="Enter Your User ID..."
                required
              />
            </div>
          </div>
        </div>
        <div>
          <div className="mt-2">
            <button
              type="submit"
              className="rounded-md w-full bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600"
            >
              Connect
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};
export default Login;
