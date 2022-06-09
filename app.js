const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "covid19India.db");
const app = express();
app.use(express.json());

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertStateDBObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDistrictDBObjectToResponseObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

app.get("/states/", async (request, response) => {
  const getStateQuery = `
    SELECT
    *
    FROM 
    state;`;

  const stateArray = await db.all(getStateQuery);
  response.send(
    stateArray.map((eachState) =>
      convertStateDBObjectToResponseObject(eachState)
    )
  );
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT
    *
    FROM 
    state
    WHERE 
    state_id = ${stateId};`;

  const state = await db.get(getStateQuery);
  response.send(convertStateDBObjectToResponseObject(state));
});

app.post("/districts/", async (request, response) => {
  const { stateId, districtName, cases, cured, active, deaths } = request.body;
  const postDistrictDetails = `
  INSERT INTO
  district ( state_id, district_name, cases, cured, active, deaths)
  VALUE
  (${stateId}, '${districtName}', ${cases}, ${cured},
  ${active}, ${deaths});`;

  await db.run(postDistrictDetails);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT
    *
    FROM 
    district
    WHERE 
    district_id = ${districtId};`;

  const district = await db.get(getDistrictQuery);
  response.send(convertDistrictDBObjectToResponseObject(district));
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrict = `
    DELETE FROM
    district 
    WHERE 
    district_id = ${districtId};`;

  await db.run(deleteDistrict);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { stateId, districtName, cases, cured, active, deaths } = request.body;
  const { districtId } = request.params;
  const updateDistrictDetails = `
    UPDATE 
    district 
    SET 
    district_name: '${districtName}', 
    state_id: ${stateId}, 
    cases: ${cases}, 
    cured: ${cured},
    active: ${active},
    deaths: ${deaths}
    WHERE 
    district_id = ${districtId};`;

  await db.run(updateDistrictDetails);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getCasesDetails = `
    SELECT 
    sum(cases) ,
    sum(cured) .
    sum(active),
    sum(deaths)
    FROM
    district
    WHERE 
    state_id =  ${stateId};`;

  const stats = await db.all(getCasesDetails);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured"],
    totalActive: stats["SUM(active"],
    totalDeaths: stats["Sum(deaths"],
  });
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStatesNameQuery = `
    SELECT
    state_name
    FROM 
    district
    NATURAL JOIN 
    state
    WHERE 
    district_id  = ${districtId} ;`;

  const state = await db.get(getStatesNameQuery);
  response.send({ statesName: state.state_name });
});

module.exports = app;
