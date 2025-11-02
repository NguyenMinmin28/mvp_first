"use client";

import * as React from "react";
import { Check, ChevronDown, Search, MapPin } from "lucide-react";
import { cn } from "@/core/utils/utils";
import { Button } from "./button";
import { Input } from "./input";

interface Country {
  code: string;
  name: string;
  cities: string[];
}

interface CountryCitySelectProps {
  country?: string;
  city?: string;
  onCountryChange: (country: string) => void;
  onCityChange: (city: string) => void;
  placeholder?: string;
  className?: string;
}

// Major countries with their major cities
export const countriesWithCities: Country[] = [
  {
    code: "US",
    name: "United States",
    cities: [
      "New York, NY",
      "Los Angeles, CA",
      "Chicago, IL",
      "Houston, TX",
      "Phoenix, AZ",
      "Philadelphia, PA",
      "San Antonio, TX",
      "San Diego, CA",
      "Dallas, TX",
      "San Jose, CA",
      "Austin, TX",
      "Jacksonville, FL",
      "San Francisco, CA",
      "Indianapolis, IN",
      "Columbus, OH",
      "Fort Worth, TX",
      "Charlotte, NC",
      "Seattle, WA",
      "Denver, CO",
      "Boston, MA",
      "Nashville, TN",
      "Portland, OR",
      "Miami, FL",
      "Atlanta, GA",
      "Washington, DC",
      "Detroit, MI",
      "Las Vegas, NV",
      "Minneapolis, MN",
      "Tampa, FL",
      "Orlando, FL",
    ],
  },
  {
    code: "CA",
    name: "Canada",
    cities: [
      "Toronto, ON",
      "Montreal, QC",
      "Vancouver, BC",
      "Calgary, AB",
      "Edmonton, AB",
      "Ottawa, ON",
      "Winnipeg, MB",
      "Quebec City, QC",
      "Hamilton, ON",
      "Kitchener, ON",
    ],
  },
  {
    code: "GB",
    name: "United Kingdom",
    cities: [
      "London",
      "Manchester",
      "Birmingham",
      "Leeds",
      "Glasgow",
      "Liverpool",
      "Newcastle",
      "Sheffield",
      "Edinburgh",
      "Bristol",
    ],
  },
  {
    code: "AU",
    name: "Australia",
    cities: [
      "Sydney, NSW",
      "Melbourne, VIC",
      "Brisbane, QLD",
      "Perth, WA",
      "Adelaide, SA",
      "Gold Coast, QLD",
      "Newcastle, NSW",
      "Canberra, ACT",
      "Sunshine Coast, QLD",
      "Wollongong, NSW",
    ],
  },
  {
    code: "DE",
    name: "Germany",
    cities: [
      "Berlin",
      "Munich",
      "Hamburg",
      "Frankfurt",
      "Cologne",
      "Stuttgart",
      "Düsseldorf",
      "Dortmund",
      "Essen",
      "Leipzig",
    ],
  },
  {
    code: "FR",
    name: "France",
    cities: [
      "Paris",
      "Lyon",
      "Marseille",
      "Toulouse",
      "Nice",
      "Nantes",
      "Strasbourg",
      "Montpellier",
      "Bordeaux",
      "Lille",
    ],
  },
  {
    code: "IN",
    name: "India",
    cities: [
      "Mumbai, Maharashtra",
      "Delhi",
      "Bangalore, Karnataka",
      "Hyderabad, Telangana",
      "Chennai, Tamil Nadu",
      "Kolkata, West Bengal",
      "Pune, Maharashtra",
      "Ahmedabad, Gujarat",
      "Jaipur, Rajasthan",
      "Surat, Gujarat",
    ],
  },
  {
    code: "SG",
    name: "Singapore",
    cities: ["Singapore"],
  },
  {
    code: "ID",
    name: "Indonesia",
    cities: [
      "Jakarta",
      "Surabaya, East Java",
      "Bandung, West Java",
      "Medan, North Sumatra",
      "Semarang, Central Java",
      "Makassar, South Sulawesi",
      "Palembang, South Sumatra",
      "Tangerang, Banten",
      "Depok, West Java",
      "Bekasi, West Java",
    ],
  },
  {
    code: "MY",
    name: "Malaysia",
    cities: [
      "Kuala Lumpur",
      "George Town, Penang",
      "Ipoh, Perak",
      "Johor Bahru, Johor",
      "Melaka",
      "Kuching, Sarawak",
      "Kota Kinabalu, Sabah",
      "Shah Alam, Selangor",
      "Petaling Jaya, Selangor",
      "Subang Jaya, Selangor",
    ],
  },
  {
    code: "VN",
    name: "Vietnam",
    cities: [
      "Ho Chi Minh City",
      "Hanoi",
      "Da Nang",
      "Haiphong",
      "Can Tho",
      "Bien Hoa, Dong Nai",
      "Hue",
      "Nha Trang, Khanh Hoa",
      "Vung Tau, Ba Ria-Vung Tau",
      "Quy Nhon, Binh Dinh",
    ],
  },
  {
    code: "PH",
    name: "Philippines",
    cities: [
      "Manila",
      "Quezon City",
      "Caloocan",
      "Davao City",
      "Cebu City",
      "Zamboanga City",
      "Antipolo, Rizal",
      "Pasig",
      "Taguig",
      "Valenzuela",
    ],
  },
  {
    code: "TH",
    name: "Thailand",
    cities: [
      "Bangkok",
      "Chiang Mai",
      "Pattaya, Chonburi",
      "Hat Yai, Songkhla",
      "Nonthaburi",
      "Nakhon Ratchasima",
      "Udon Thani",
      "Phuket",
      "Khon Kaen",
      "Chaophraya Surasak, Chonburi",
    ],
  },
  {
    code: "JP",
    name: "Japan",
    cities: [
      "Tokyo",
      "Yokohama",
      "Osaka",
      "Nagoya",
      "Sapporo",
      "Fukuoka",
      "Kobe",
      "Kyoto",
      "Sendai",
      "Hiroshima",
    ],
  },
  {
    code: "KR",
    name: "South Korea",
    cities: [
      "Seoul",
      "Busan",
      "Incheon",
      "Daegu",
      "Daejeon",
      "Gwangju",
      "Suwon, Gyeonggi",
      "Ulsan",
      "Changwon, Gyeongsangnam",
      "Goyang, Gyeonggi",
    ],
  },
  {
    code: "CN",
    name: "China",
    cities: [
      "Shanghai",
      "Beijing",
      "Shenzhen, Guangdong",
      "Guangzhou, Guangdong",
      "Chengdu, Sichuan",
      "Chongqing",
      "Hangzhou, Zhejiang",
      "Wuhan, Hubei",
      "Xi'an, Shaanxi",
      "Tianjin",
    ],
  },
  {
    code: "IT",
    name: "Italy",
    cities: [
      "Rome",
      "Milan",
      "Naples",
      "Turin",
      "Palermo",
      "Genoa",
      "Bologna",
      "Florence",
      "Bari",
      "Catania",
    ],
  },
  {
    code: "ES",
    name: "Spain",
    cities: [
      "Madrid",
      "Barcelona",
      "Valencia",
      "Seville",
      "Zaragoza",
      "Málaga",
      "Murcia",
      "Palma",
      "Las Palmas",
      "Bilbao",
    ],
  },
  {
    code: "BR",
    name: "Brazil",
    cities: [
      "São Paulo, SP",
      "Rio de Janeiro, RJ",
      "Brasília, DF",
      "Salvador, BA",
      "Fortaleza, CE",
      "Belo Horizonte, MG",
      "Manaus, AM",
      "Curitiba, PR",
      "Recife, PE",
      "Porto Alegre, RS",
    ],
  },
  {
    code: "MX",
    name: "Mexico",
    cities: [
      "Mexico City",
      "Guadalajara, Jalisco",
      "Monterrey, Nuevo León",
      "Puebla",
      "Tijuana, Baja California",
      "León, Guanajuato",
      "Juárez, Chihuahua",
      "Torreón, Coahuila",
      "Querétaro",
      "San Luis Potosí",
    ],
  },
  {
    code: "AE",
    name: "United Arab Emirates",
    cities: [
      "Dubai",
      "Abu Dhabi",
      "Sharjah",
      "Al Ain",
      "Ajman",
      "Ras Al Khaimah",
      "Fujairah",
      "Umm Al Quwain",
    ],
  },
  {
    code: "SA",
    name: "Saudi Arabia",
    cities: [
      "Riyadh",
      "Jeddah, Makkah",
      "Mecca, Makkah",
      "Medina, Al Madinah",
      "Dammam, Eastern Province",
      "Khobar, Eastern Province",
      "Taif, Makkah",
      "Abha, Asir",
      "Tabuk",
      "Buraydah, Al Qassim",
    ],
  },
  {
    code: "ZA",
    name: "South Africa",
    cities: [
      "Johannesburg, Gauteng",
      "Cape Town, Western Cape",
      "Durban, KwaZulu-Natal",
      "Pretoria, Gauteng",
      "Port Elizabeth, Eastern Cape",
      "Bloemfontein, Free State",
      "East London, Eastern Cape",
      "Polokwane, Limpopo",
      "Nelspruit, Mpumalanga",
      "Kimberley, Northern Cape",
    ],
  },
  {
    code: "NG",
    name: "Nigeria",
    cities: [
      "Lagos",
      "Kano",
      "Ibadan, Oyo",
      "Abuja",
      "Port Harcourt, Rivers",
      "Benin City, Edo",
      "Kaduna",
      "Aba, Abia",
      "Maiduguri, Borno",
      "Ilorin, Kwara",
    ],
  },
  {
    code: "KE",
    name: "Kenya",
    cities: [
      "Nairobi",
      "Mombasa",
      "Kisumu",
      "Nakuru",
      "Eldoret",
      "Thika",
      "Malindi",
      "Kitale",
      "Garissa",
      "Kakamega",
    ],
  },
  {
    code: "EG",
    name: "Egypt",
    cities: [
      "Cairo",
      "Alexandria",
      "Giza",
      "Shubra El Kheima",
      "Port Said",
      "Suez",
      "Luxor",
      "Aswan",
      "Asyut",
      "Ismailia",
    ],
  },
  {
    code: "PK",
    name: "Pakistan",
    cities: [
      "Karachi, Sindh",
      "Lahore, Punjab",
      "Faisalabad, Punjab",
      "Rawalpindi, Punjab",
      "Multan, Punjab",
      "Gujranwala, Punjab",
      "Hyderabad, Sindh",
      "Peshawar, Khyber Pakhtunkhwa",
      "Islamabad",
      "Quetta, Balochistan",
    ],
  },
  {
    code: "BD",
    name: "Bangladesh",
    cities: [
      "Dhaka",
      "Chittagong",
      "Khulna",
      "Sylhet",
      "Rajshahi",
      "Comilla",
      "Narayanganj",
      "Mymensingh",
      "Rangpur",
      "Barisal",
    ],
  },
  {
    code: "AR",
    name: "Argentina",
    cities: [
      "Buenos Aires",
      "Córdoba",
      "Rosario, Santa Fe",
      "Mendoza",
      "Tucumán",
      "La Plata, Buenos Aires",
      "Mar del Plata, Buenos Aires",
      "Salta",
      "Santa Fe",
      "San Juan",
    ],
  },
  {
    code: "CL",
    name: "Chile",
    cities: [
      "Santiago",
      "Valparaíso",
      "Concepción",
      "La Serena",
      "Antofagasta",
      "Temuco",
      "Rancagua",
      "Arica",
      "Talca",
      "Iquique",
    ],
  },
  {
    code: "CO",
    name: "Colombia",
    cities: [
      "Bogotá",
      "Medellín, Antioquia",
      "Cali, Valle del Cauca",
      "Barranquilla, Atlántico",
      "Cartagena, Bolívar",
      "Cúcuta, Norte de Santander",
      "Bucaramanga, Santander",
      "Pereira, Risaralda",
      "Santa Marta, Magdalena",
      "Manizales, Caldas",
    ],
  },
  {
    code: "PE",
    name: "Peru",
    cities: [
      "Lima",
      "Arequipa",
      "Trujillo, La Libertad",
      "Chiclayo, Lambayeque",
      "Huancayo, Junín",
      "Iquitos, Loreto",
      "Piura",
      "Cusco",
      "Chimbote, Ancash",
      "Pucallpa, Ucayali",
    ],
  },
];

export function CountryCitySelect({
  country,
  city,
  onCountryChange,
  onCityChange,
  placeholder = "Select country and city",
  className,
}: CountryCitySelectProps) {
  const [countryOpen, setCountryOpen] = React.useState(false);
  const [cityOpen, setCityOpen] = React.useState(false);
  const [countrySearch, setCountrySearch] = React.useState("");
  const [citySearch, setCitySearch] = React.useState("");

  const selectedCountryData = countriesWithCities.find((c) => c.code === country);
  const filteredCountries = React.useMemo(() => {
    if (countrySearch.trim() === "") return countriesWithCities;
    return countriesWithCities.filter((c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase())
    );
  }, [countrySearch]);

  const filteredCities = React.useMemo(() => {
    if (!selectedCountryData) return [];
    if (citySearch.trim() === "") return selectedCountryData.cities;
    return selectedCountryData.cities.filter((c) =>
      c.toLowerCase().includes(citySearch.toLowerCase())
    );
  }, [selectedCountryData, citySearch]);

  const handleCountrySelect = (countryCode: string) => {
    onCountryChange(countryCode);
    onCityChange(""); // Reset city when country changes
    setCountryOpen(false);
    setCountrySearch("");
  };

  const handleCitySelect = (selectedCity: string) => {
    onCityChange(selectedCity);
    setCityOpen(false);
    setCitySearch("");
  };

  // Format location for display: "City, State, Country"
  const formattedLocation = React.useMemo(() => {
    if (!selectedCountryData || !city) return "";
    return `${city}, ${selectedCountryData.name}`;
  }, [selectedCountryData, city]);

  return (
    <div className={cn("space-y-2", className)}>
      {/* Country Select */}
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={countryOpen}
          className="w-full justify-between"
          onClick={() => setCountryOpen(!countryOpen)}
        >
          {selectedCountryData ? (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span>{selectedCountryData.name}</span>
            </div>
          ) : (
            <span className="text-gray-500">Select country</span>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>

        {countryOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search countries..."
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  className="pl-8"
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-60 overflow-auto">
              {filteredCountries.length > 0 ? (
                filteredCountries.map((countryData) => (
                  <button
                    key={countryData.code}
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center justify-between"
                    onClick={() => handleCountrySelect(countryData.code)}
                  >
                    <span>{countryData.name}</span>
                    {country === countryData.code && (
                      <Check className="h-4 w-4 text-blue-600" />
                    )}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-gray-500 text-sm">
                  No countries found
                </div>
              )}
            </div>
          </div>
        )}

        {countryOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setCountryOpen(false)}
          />
        )}
      </div>

      {/* City Select - Only show if country is selected */}
      {selectedCountryData && (
        <div className="relative">
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={cityOpen}
            className="w-full justify-between"
            onClick={() => setCityOpen(!cityOpen)}
          >
            {city ? (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span>{city}</span>
              </div>
            ) : (
              <span className="text-gray-500">Select city</span>
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>

          {cityOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
              <div className="p-2 border-b">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search cities..."
                    value={citySearch}
                    onChange={(e) => setCitySearch(e.target.value)}
                    className="pl-8"
                    autoFocus
                  />
                </div>
              </div>
              <div className="max-h-60 overflow-auto">
                {filteredCities.length > 0 ? (
                  filteredCities.map((cityName) => (
                    <button
                      key={cityName}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center justify-between"
                      onClick={() => handleCitySelect(cityName)}
                    >
                      <span>{cityName}</span>
                      {city === cityName && (
                        <Check className="h-4 w-4 text-blue-600" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-gray-500 text-sm">
                    No cities found
                  </div>
                )}
              </div>
            </div>
          )}

          {cityOpen && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => setCityOpen(false)}
            />
          )}
        </div>
      )}

      {/* Display formatted location */}
      {formattedLocation && (
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          <span>Location: {formattedLocation}</span>
        </p>
      )}
    </div>
  );
}
