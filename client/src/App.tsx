import { useState, useEffect, useRef } from "react";
import reactLogo from "./assets/react.svg";
import "./App.css";
import Directory from "./Directory";
import {
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  List,
} from "@chakra-ui/react";
import { Extension } from "typescript";

interface file {
  name: string;
  url: string;
  sha: string;
  type: string;
}

export interface display {
  name: string;
  path: string;
  sha: string;
  type: string;
  url: string;
  items?: display[] | null;
}

const CLIENT_ID = "73daa323db85d222993d";
const CLIENT_SECRET = "5a90e777807223111c183a883f19ecadb6690713";

function App() {
  const [rerender, setRerender] = useState(false);
  const [userData, setUserData] = useState("");
  const [repos, setRepos] = useState<string[]>([]);
  const [currentRepo, setCurrentRepo] = useState<string>("");
  const [repoFiles, setRepoFiles] = useState<file[]>([]);
  const [text, setText] = useState<string>("");
  const [currentStatus, setCurrentStatus] = useState<display>({
    name: "",
    url: "",
    sha: "",
    type: "",
    path: "",
  });

  const [explorer, setExplorer] = useState<display>({
    name: "",
    path: "",
    sha: "",
    type: "",
    url: "",
  });

  let count = 0;
  const [commitMessage, setCommitMessage] = useState<string>("");

  // const ref = useRef<HTMLTextAreaElement>(null);

  function loginWithGithub() {
    window.location.assign(
      "https://github.com/login/oauth/authorize?client_id=" +
        CLIENT_ID +
        "&scope=user repo"
    );
  }

  async function getUserData() {
    await fetch("http://localhost:4000/getUserData", {
      method: "GET",
      headers: {
        Authorization: "Bearer " + localStorage.getItem("accessToken"), //Bearer access token
      },
    })
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        console.log(data);
        setUserData(data);
      });
  }

  async function getAllRepo() {
    await fetch("http://localhost:4000/getAllRepo2", {
      method: "GET",
      headers: {
        Authorization: "Bearer " + localStorage.getItem("accessToken"), //Bearer access token
      },
    })
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        console.log(data);
        setRepos(data);
      });
  }
  function displayBetter(prefixString: string, data: file[]): display[] | null {
    //display
    let result: display[] = [];
    if (prefixString === "folder_level_1_1") console.log("hellowow");
    while (count < data.length) {
      const current = data[count];

      if (current.name.startsWith(prefixString)) {
        if (current.type === "tree") {
          if (prefixString === "folder_level_1_1") console.log("hellowow file");
          let val: display = {
            name: current.name.slice(prefixString.length),
            path: current.name,
            sha: current.sha,
            type: current.type,
            url: current.url,
          };
          count++;
          val.items = displayBetter(current.name, data);
          result.push(val);
        } else {
          if (prefixString === "folder_level_1_1")
            console.log("hellowow chekc");
          let val: display = {
            name: current.name.slice(prefixString.length),
            path: current.name,
            sha: current.sha,
            type: current.type,
            url: current.url,
          };
          count++;
          result.push(val);
          console.log("hello");
        }
      } else {
        console.log("check");
        return result;
      }
    }
    return result;
  }
  async function getRepoFiles(repoName: string) {
    setCurrentRepo(repoName);
    await fetch("http://localhost:4000/getRepoFiles?name=" + repoName, {
      method: "GET",
      headers: {
        Authorization: "Bearer " + localStorage.getItem("accessToken"), //Bearer access token
      },
    })
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        console.log(data);
        setRepoFiles(data);
        setExplorer({
          name: repoName,
          type: "tree",
          items: displayBetter("", data),
          path: "",
          sha: "",
          url: "",
        });
        count = 0;
        console.log(data);
      });
  }

  async function getFileContent(fileContent: {
    name: string;
    path: string;
    sha: string;
    type: string;
    url: string;
  }) {
    await fetch(
      "http://localhost:4000/getFileContent?name=" + fileContent.url,
      {
        method: "GET",
        headers: {
          Authorization: "Bearer " + localStorage.getItem("accessToken"), //Bearer access token
        },
      }
    )
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        //console.log(data);
        // if (ref.current) ref.current.value = data;
        setText(data);
        setCurrentStatus({ ...fileContent });
        console.log(data);
      });
  }

  async function pushFile(
    fileContent: {
      name: string;
      path: string;
      sha: string;
      type: string;
      url: string;
    },
    text: string,
    commit: string
  ) {
    await fetch(
      "http://localhost:4000/pushFile2?name=" +
        fileContent.name +
        "&path=" +
        fileContent.path +
        "&url=" +
        fileContent.url +
        "&sha=" +
        fileContent.sha +
        "&content=" +
        text +
        "&commit=" +
        commit,
      {
        method: "GET",
        headers: {
          Authorization: "Bearer " + localStorage.getItem("accessToken"), //Bearer access token
        },
      }
    ).then((response) => {
      console.log(response);
      return response.json();
    });
    // .then((data) => {
    //   console.log(data);
    //   setCurrentStatus({ ...data });
    // });
    getRepoFiles(currentRepo);
  }

  useEffect(() => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const codeParam = urlParams.get("code");
    console.log(codeParam);

    if (codeParam && localStorage.getItem("accessToken") === null) {
      async function getAccessToken() {
        await fetch("http://localhost:4000/getAccessToken?code=" + codeParam, {
          method: "GET",
        })
          .then((response) => {
            return response.json();
          })
          .then((data) => {
            console.log(data);
            if (data.access_token) {
              localStorage.setItem("accessToken", data.access_token);
              setRerender(!rerender);
            }
          });
      }
      getAccessToken();
    }
  }, []);

  return (
    <div className="App">
      {localStorage.getItem("accessToken") && (
        <>
          <h1>We have the access token</h1>
          <button
            onClick={() => {
              localStorage.removeItem("accessToken");
              setRerender(!rerender);
            }}
          >
            Logout
          </button>
        </>
      )}
      <button onClick={loginWithGithub}>Login with github</button>
      <h3>Get User Data</h3>
      <button onClick={getUserData}>getuserdata</button>
      <p>{JSON.stringify(userData)}</p>
      <button onClick={getAllRepo}>getAllRepo</button>
      <ul>
        {repos.map((repo, i) => (
          <li
            key={i}
            onClick={() => {
              getRepoFiles(repo);
            }}
          >
            {repo}
          </li>
        ))}
      </ul>
      <p>{currentRepo}</p>
      {/* <ul>
        {repoFiles.map((repoFile, i) => (
          <li
            key={i}
            onClick={() => {
              getFileContent(repoFile);
            }}
          >
            {repoFile.name}
          </li>
        ))}
      </ul> */}
      <div className="outer">
        <div className="spacing">
          <List>
            <Directory file={explorer} onClick={getFileContent} />
          </List>
        </div>
      </div>

      <Tabs variant="enclosed">
        <TabList>
          <Tab>{currentStatus.name}</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <textarea
              style={{ width: "100%", height: "400px" }}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
      <input
        type="text"
        placeholder="Enter commit message"
        onChange={(e) => setCommitMessage(e.target.value)}
      ></input>
      <button onClick={() => pushFile(currentStatus, text, commitMessage)}>
        Push
      </button>
    </div>
  );
}

export default App;
