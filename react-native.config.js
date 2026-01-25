module.exports = {
  project: {
    ios: {},
    android: {},
  },
  codegenConfig: {
    name: 'sceneapp',
    type: 'modules',
    jsSrcsDir: './src/modules',
    android: {
      javaPackageName: 'com.sceneapp',
    },
  },
};
