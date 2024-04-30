import { expect } from "chai";
import axios from "axios";

describe("Weather API", function () {
  it("should return weather data for Moscow", async function () {
    const response = await axios.get(
      "http://localhost:3000/weather?lat=55.7558&lon=37.6173",
    );
    expect(response.status).to.equal(200);
    expect(response.data).to.be.an("array");
  });
});
