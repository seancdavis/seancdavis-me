const { spawn } = require("child_process");

let serverProcess;
const port = "4567";

const testPaths = [
  "/",
  "/blog",
  "/blog/page-2/",
  "/404.html",
  "/license/",
  "/topics/javascript/",
  "/topics/javascript/page-2/",
  // twitter embed, youtube embed, code block filename, code blocks, image (GIF)
  "/posts/three-ways-to-add-image-to-github-readme/",
  // back-to-back code blocks with filenames, youtube embed, note callout
  "/posts/build-static-api-gatsby/",
  // code blocsk with filenames, warning callout
  "/posts/getting-started-with-postcss/",
  // blockquote, images
  "/posts/git-safe-force-push/",
  // top 5 posts
  "/posts/git-accept-merge-all-changes/",
  "/posts/wait-until-all-images-loaded/",
  "/posts/4-ways-to-pass-arguments-to-a-rake-task/",
  "/posts/change-css-iframe/",
  "/posts/fix-yarn-integrity-check-failed/",
];

const buildUrl = (path) => {
  const baseUrl = `http://localhost:${port}`;
  const url = new URL(path, baseUrl);
  return url.toString();
};

const sleep = async (timeMs = 1000) => {
  return new Promise((resolve) => {
    setTimeout(resolve, timeMs);
  });
};

const shutdown = async () => {
  if (serverProcess) {
    await serverProcess.kill();
  }
};

const waitForServer = async (count = 0) => {
  if (count >= 30) {
    throw new Error("giving up on the server...");
  }

  try {
    const page = await browser.newPage();
    await page.goto(buildUrl("/"));
  } catch (error) {
    await sleep(1000);
    await waitForServer(count + 1);
  }
};

const startServer = async () => {
  serverProcess = spawn("./node_modules/.bin/http-server", [
    "./dist",
    "--port",
    port,
  ]);

  await waitForServer();
  await sleep();

  return true;
};

describe("Visual Regression", () => {
  beforeAll(async () => {
    await startServer();
  });

  afterAll(async () => {
    await shutdown();
  });

  for (let testPath of testPaths) {
    describe(testPath, () => {
      it("has not changed mobile rendering", async () => {
        const page = await browser.newPage();
        await page.setViewport({ width: 400, height: 800 });
        await page.goto(buildUrl(testPath));
        const image = await page.screenshot({ fullPage: true });
        expect(image).toMatchImageSnapshot();
      });

      it("has not changed desktop rendering", async () => {
        const page = await browser.newPage();
        await page.goto(buildUrl(testPath));
        const image = await page.screenshot({ fullPage: true });
        expect(image).toMatchImageSnapshot();
      });
    });
  }
});
