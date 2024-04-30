import { expect } from "chai";
import axios from "axios";

describe("Weather by search API", function () {
  it("should return weather data for Moscow", async function () {
    const response = await axios.get(
      "http://localhost:3000/weatherBySearch?search=Москва",
    );
    expect(response.status).to.equal(200);
    expect(response.data).to.be.an("array");
  });
});
