// babel.config.js
module.exports = function (api) {
  api.cache(true);

  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./src"],
          alias: {
            shared: "../../shared", // 👈 maps to shared folder
          },
        },
      ],
      // 👇 Must always be last for Reanimated to work correctly
    ],
  };
};
