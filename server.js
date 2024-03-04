var express = require('express');
var cors = require('cors');
var base64 = require('js-base64').Base64;
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
var bodyParser = require('body-parser');
const {Octokit} = require('@octokit/rest');
const CLIENT_ID = "73daa323db85d222993d";
const CLIENT_SECRET = "5a90e777807223111c183a883f19ecadb6690713";

var app = express();

app.use(cors());
app.use(bodyParser.json());

const saveArray= [];

//code passed from frontend
app.get('/getAccessToken', async function (req, res) {
    

    const params = "?client_id=" + CLIENT_ID + "&client_secret=" + CLIENT_SECRET + "&code=" + req.query.code;

    await fetch("https://github.com/login/oauth/access_token" + params, {
        method: "POST",
        headers: {
            "Accept" : "application/json"
        }
    }).then((response) => {
        return response.json();
    }).then((data) => {
        res.json(data);
    });
})


//get user dat
//access token as authorization header

app.get("/getUserData", async function(req, res) {
    req.get("Authorization");
    await fetch("https://api.github.com/user", {
        method: "GET",
        headers: {
            "Authorization" : req.get("Authorization")
        }
    }).then((response) => {
        return response.json();
    }).then((data) => {
        res.json(data);
    })
})

app.get("/getAllRepo", async function(req, res) {
    const result = [];
    req.get("Authorization");
    await fetch("https://api.github.com/user/repos", {
        method: "GET",
        headers: {
            "Authorization" : req.get("Authorization")
        }
    }).then((response) => {
        return response.json();
    }).then((data) => {
        for( let i  in data){
            result.push(data[i].full_name);
        }
        res.json(result);
    })
})

app.get("/getAllRepo2", async function(req, res) {
    const query = `query searchRepositories(
        $search: String!
    ) {
        viewer {
            repositories(first: 100, orderBy: { field: UPDATED_AT, direction: DESC }) {
                nodes {
                    nameWithOwner
                    description
                    url
                    parent {
                        nameWithOwner
                    }
                    stargazerCount
                }
            }
        }
        search(first: 100, query: $search, type: REPOSITORY) {
            nodes {
                ...on Repository {
                    nameWithOwner
                    description
                    url
                    parent {
                        nameWithOwner
                    }
                    stargazerCount
                }
            }
        }
    }`;
    const result = [];
    req.get("Authorization");
    await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: {
            "Content-Type" : "application/json",
            "Authorization" : req.get("Authorization")
        },
        body: JSON.stringify( {query: query, variables: 
            {search: "sort:updated fork:true"} })
    }).then((response) => {
        return response.json();
    }).then((data) => {
        for( let i  in data.data.viewer.repositories.nodes){
            result.push(data.data.viewer.repositories.nodes[i].nameWithOwner);
        }
        res.json(result);
    })
})

app.get("/getRepoFiles" , async function(req, res) {
    const result = [];
    let file = {
        name: "",
        url: ""
    }
    req.get("Authorization");
    await fetch("https://api.github.com/repos/" + req.query.name+"/git/trees/main?recursive=1", {
        method: "GET",
        headers: {
            "Authorization" : req.get("Authorization")
        }
    }).then((response) => {
        return response.json();
    }).then((data) => {
        for(let i in data.tree){
            result.push({name:data.tree[i].path, url:data.tree[i].url, sha:data.tree[i].sha, type:data.tree[i].type});
        }
        console.log(result);
        res.json(result);
    }) 
})

app.get("/getFileContent", async function(req, res){
    // const octokit = new Octokit({
    //     auth: req.get("Authorization")
    // })
    // await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
    //     owner: 'TPragadeesh',
    //     repo: 'Synccheck',
    //     path: 'newfile.txt',
      
    //   }).then((response) => {
    //     console.log(typeof response);
    //     console.log(response.data);
    //     return response.data;
    // }).then((data) => {
    //     console.log(data.content);
    //     var contents = base64.decode(data.content);
    //     res.json(contents);
    // })

    for(let i in saveArray){
        if(saveArray[i].path === req.query.path){
            console.log("get check");
            return res.json(base64.decode(saveArray[i].contents));
        }
    }

    req.get("Authorization");
    await fetch(req.query.url, {
        method: "GET",
        headers: {
            "Authorization" : req.get("Authorization")
        }
    }).then((response) => {
        return response.json();
    }).then((data) => {
        
        var contents = base64.decode(data.content);
        res.json(contents);
    })
})

app.get("/pushFile", async function(req, res){
    
    req.get("Authorization");
    const octokit = new Octokit({
        auth: req.get("Authorization")
    })
    console.log(req.query.content);
    const encodedTest = base64.encode(req.query.content);
    console.log(encodedTest);
    console.log(req.query.name);
    const removePrefix = (req.query.url).substr(22);
    console.log(removePrefix);
    const partUrl = removePrefix.substr(0, removePrefix.length - 50);
    console.log(partUrl);
    const newUrl = partUrl+"contents/" + req.query.name;

    const commitMessage = req.query.commit;

    await octokit.request('PUT ' + newUrl, {
        message: commitMessage,
        committer: {
          name: 'TPragadeesh',
          email: 'pragadeeshta@gmail.com'
        },
        sha: req.query.sha,
        content: encodedTest,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      }).then((response) => {
        return response.data;
    }).then((data) => {
        
        const obj = {name: data.content.path, sha:data.content.sha, url:data.content.git_url, type: data.content.type};
        console.log(JSON.stringify(obj));
        res.json(obj);
    })

    // call getrepofiles


    // await fetch("https://api.github.com/repos/TPragadeesh/Synccheck/contents/newfile.txt?message='git post'&committer={name: 'TPragadeesh', email:'pragadeeshta@gmail.com'}&content='aGVsbG8='", {
    //     method: "PUT",
    //     headers: {
    //         "Authorization" : req.get("Authorization")
    //     }
    // }).then((response) => {
    //     return response.json();
    // }).then((data) => {
    //     console.log(data);
    //     res.json(data);
    // })


    //ussername
    //reponame
    //sha
    //encoded content
    // await octokit.request('PUT /repos/TPragadeesh/Synccheck/contents/newfile.txt', {
    //     // owner: 'OWNER',
    //     // repo: 'REPO',
    //     // path: 'PATH',
    //     message: 'my commit message',
    //     committer: {
    //       name: 'TPragadeesh',
    //       email: 'pragadeeshta@gmail.com'
    //     },
    //     sha: '0d5a690c8fad5e605a6e8766295d9d459d65de42',
    //     content: 'bXkgbmV3IGZpbGUgY29udGVudHM=',
    //     headers: {
    //       'X-GitHub-Api-Version': '2022-11-28'
    //     }
    //   }).then((response) => {
    //     console.log(response);
    //     return response.json();
    // }).then((data) => {
    //     console.log(data);
    //     res.json(data);
    // })
    
})


app.get("/saveContent", async function (req, res) {
    for(let i in saveArray){
        if(saveArray[i].path === req.query.path){
            saveArray[i].contents = base64.encode(req.query.content);
            console.log("old check");
            return res.sendStatus(200);
        }
    }
    saveArray.push({path: req.query.path, contents: base64.encode(req.query.content)});
    console.log("new additoin");
    return res.sendStatus(200);
})

app.get("/pushFile2", async function(req, res){
    console.log("please");
    req.get("Authorization");
    const str = "https://api.github.com/repos/";
    const len = str.length;
    const removePrefix = (req.query.url).substr(len);
    console.log(removePrefix);
    const partUrl = removePrefix.substr(0, removePrefix.length - 51);

    console.log(partUrl);
    console.log("please again");
    const commitMessage = req.query.commit;

    const query1 = `query getBranch(
        $owner: String!
        $repo: String!
        $qualifiedName: String!
    ) {
        repository(owner: $owner, name: $repo) {
            ref(qualifiedName: $qualifiedName) {
                name
                target {
                    oid
                    commitUrl
                }
                refUpdateRule {
                    viewerCanPush
                    requiredApprovingReviewCount
                }
            }
        }
    }`;
    const query2 = `mutation CreateCommitOnBranch ($commitInput: CreateCommitOnBranchInput!) {
        createCommitOnBranch(input: $commitInput) {
            commit {
                oid
            }
            ref {
                name
            }
        }
    }`
    let oid;
    //helo/wo
    const owner1 = partUrl.slice(0, partUrl.indexOf("/"));
    const repo1 = partUrl.slice(partUrl.indexOf("/")+1);
    console.log(owner1);
    console.log(repo1);
    const qualifiedName = "refs/heads/main";
    
    let variables1 = {owner: owner1, qualifiedName: qualifiedName, repo: repo1};

    await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: {
            "Content-Type" : "application/json",
            "Authorization" : req.get("Authorization")
        },
        body: JSON.stringify( {query: query1, variables: 
            variables1 })
    }).then((response) => {
        return response.json();
    }).then((data) => {
        oid = data.data.repository.ref.target.oid;
        console.log(oid);
        
    });
    let variable2 = {
        commitInput: {
            branch: {
                branchName: "main",
                repositoryNameWithOwner: partUrl,
            },
            message: {
                headline: commitMessage
            },
            expectedHeadOid: oid,
            fileChanges: {
                additions: saveArray,
                deletions: []
            }
            
        }
    };

    console.log(oid);
    console.log(variable2);
    
    await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: {
            "Authorization" : req.get("Authorization")
        },
        body: JSON.stringify( {query: query2, variables: 
            variable2 })
        

    }).then((response) => {
        return response.json();
    }).then((data) => {
        saveArray.splice(0, saveArray.length);
        console.log(data);
        res.sendStatus(200);
    })
})

app.listen(4000, function () {
    console.log("CORS server running on port 4000");
})