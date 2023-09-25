const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const startServerAndDB = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log("DB Error: ${e.message}");
    process.exit(1);
  }
};

startServerAndDB();

//GET ALL STATES API

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT 
        * 
    FROM 
        state
    ORDER BY 
        state_id;`;
  const getStates = await db.all(getStatesQuery);
  response.send(
    getStates.map((each) => {
      return {
        stateId: each.state_id,
        stateName: each.state_name,
        population: each.population,
      };
    })
  );
});
module.exports = app;

//GET SELECTED STATE API

app.get("/states/:stateId", async (request, response) => {
  const { stateId } = request.params;
  getStateQuery = `
    SELECT
        *
    FROM 
        state
    WHERE
        state_id = ${stateId};`;
  const getState = await db.get(getStateQuery);
  const respDB = {
    stateId: getState.state_id,
    stateName: getState.state_name,
    population: getState.population,
  };
  response.send(respDB);
});
module.exports = app;

//CREATE DISTRICT API

app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;

  const createDistrictQuery = `
  INSERT INTO
    districts(district_name, state_id, cases, cured, active, deaths)
  VALUES
    ('${districtName}', ${stateId}, ${cases},${cured},${active},${deaths},);`;
  response.send("District Successfully Added");
});
module.exports = app;

//GET DISTRICT API

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT *
    FROM district
    WHERE district_id = ${districtId};`;

  const districtDetails = await db.get(getDistrictQuery);
  const respDb = {
    districtId: districtDetails.district_id,
    districtName: districtDetails.district_name,
    stateId: districtDetails.state_id,
    cases: districtDetails.cases,
    cured: districtDetails.cured,
    active: districtDetails.active,
    deaths: districtDetails.deaths,
  };
  response.send(respDb);
});

module.exports = app;

//DELETE DISTRICT API

app.delete("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    DELETE FROM district
    WHERE district_id = ${districtId};`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});
module.exports = app;

//UPDATE DISTRICT API

app.put("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;

  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;

  const updateDistrictQuery = `
  UPDATE
        district
  SET
        district_name = '${districtName}',
        state_id = ${stateId},
        cases = ${cases},
        cured = ${cured},
        active = ${active},
        deaths = ${deaths}
WHERE
        district_id = ${districtId}`;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});
module.exports = app;

//GET DISTRICT DETAILS BASED ON STATE ID API

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateDetailsQuery = `
    SELECT
        sum(cases) as totalCases, sum(cured) as totalCured, sum(active) as totalActive, sum(deaths) as totalDeaths
    FROM
        district
    WHERE 
        state_id = ${stateId};`;

  const stats = await db.get(getStateDetailsQuery);
  response.send(stats);
});
module.exports = app;

// GET STATE NAME BASED ON DISTRICT ID API

app.get("/districts/:districtId/details", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `
    SELECT 
        state_name as stateName
    FROM
        state INNER JOIN district
        ON state.state_id = district.state_id
    WHERE
        district.district_id = ${districtId};`;
  const details = await db.get(getStateNameQuery);
  response.send(details);
});
module.exports = app;
