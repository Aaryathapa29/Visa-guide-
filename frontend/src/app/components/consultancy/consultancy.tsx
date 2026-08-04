import { useState } from "react";
import { consultancies } from "./consultancyData";

export default function Consultancy() {
  const [selectedCountry, setSelectedCountry] = useState("All");

  const countries = [
    "All",
    "USA",
    "Canada",
    "Australia",
    "UK",
    "Japan",
    "New Zealand",
  ];

  const filteredConsultancies =
    selectedCountry === "All"
      ? consultancies
      : consultancies.filter((c) =>
          c.countries.includes(selectedCountry)
        );

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold text-center mb-8">
        Verified Consultancies
      </h1>

      <div className="flex justify-center mb-8">
        <select
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
          className="border rounded-lg px-4 py-2"
        >
          {countries.map((country) => (
            <option key={country}>{country}</option>
          ))}
        </select>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {filteredConsultancies.map((consultancy) => (
          <div
            key={consultancy.id}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center gap-4">
              <img
                src={consultancy.logo}
                alt={consultancy.name}
                className="w-20 h-20 rounded-full border"
              />

              <div>
                <h2 className="text-2xl font-semibold">
                  {consultancy.name}
                </h2>

                <p>⭐ {consultancy.rating}</p>

                <p>{consultancy.experience} Experience</p>
              </div>
            </div>

            <hr className="my-4" />

            <h3 className="font-semibold mb-2">
              Countries
            </h3>

            <div className="flex flex-wrap gap-2 mb-4">
              {consultancy.countries.map((country) => (
                <span
                  key={country}
                  className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full"
                >
                  {country}
                </span>
              ))}
            </div>

            <h3 className="font-semibold mb-2">
              Partner Universities
            </h3>

            <ul className="list-disc ml-5 mb-4">
              {consultancy.universities.map((uni) => (
                <li key={uni}>{uni}</li>
              ))}
            </ul>

            <h3 className="font-semibold mb-2">
              Services
            </h3>

            <div className="flex flex-wrap gap-2 mb-4">
              {consultancy.services.map((service) => (
                <span
                  key={service}
                  className="bg-green-100 text-green-700 px-3 py-1 rounded-full"
                >
                  {service}
                </span>
              ))}
            </div>

            <div className="space-y-1 text-sm">
              <p>
                <strong>Address:</strong> {consultancy.address}
              </p>

              <p>
                <strong>Phone:</strong> {consultancy.phone}
              </p>

              <p>
                <strong>Email:</strong> {consultancy.email}
              </p>

              <p>
                <strong>Website:</strong> {consultancy.website}
              </p>
            </div>

            <button className="w-full mt-6 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
              View Details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}