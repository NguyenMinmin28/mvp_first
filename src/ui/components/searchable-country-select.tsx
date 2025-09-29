"use client";

import * as React from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/core/utils/utils";
import { Button } from "./button";
import { Input } from "./input";

interface Country {
  code: string;
  label: string;
  name: string;
}

interface SearchableCountrySelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const countries: Country[] = [
  { code: "+1", label: "USA/Canada (+1)", name: "United States" },
  { code: "+1", label: "USA/Canada (+1)", name: "Canada" },
  { code: "+44", label: "UK (+44)", name: "United Kingdom" },
  { code: "+61", label: "Australia (+61)", name: "Australia" },
  { code: "+65", label: "Singapore (+65)", name: "Singapore" },
  { code: "+62", label: "Indonesia (+62)", name: "Indonesia" },
  { code: "+60", label: "Malaysia (+60)", name: "Malaysia" },
  { code: "+81", label: "Japan (+81)", name: "Japan" },
  { code: "+82", label: "Korea (+82)", name: "South Korea" },
  { code: "+91", label: "India (+91)", name: "India" },
  { code: "+84", label: "Vietnam (+84)", name: "Vietnam" },
  { code: "+86", label: "China (+86)", name: "China" },
  { code: "+33", label: "France (+33)", name: "France" },
  { code: "+49", label: "Germany (+49)", name: "Germany" },
  { code: "+39", label: "Italy (+39)", name: "Italy" },
  { code: "+34", label: "Spain (+34)", name: "Spain" },
  { code: "+7", label: "Russia (+7)", name: "Russia" },
  { code: "+55", label: "Brazil (+55)", name: "Brazil" },
  { code: "+52", label: "Mexico (+52)", name: "Mexico" },
  { code: "+54", label: "Argentina (+54)", name: "Argentina" },
  { code: "+27", label: "South Africa (+27)", name: "South Africa" },
  { code: "+20", label: "Egypt (+20)", name: "Egypt" },
  { code: "+234", label: "Nigeria (+234)", name: "Nigeria" },
  { code: "+254", label: "Kenya (+254)", name: "Kenya" },
  { code: "+966", label: "Saudi Arabia (+966)", name: "Saudi Arabia" },
  { code: "+971", label: "UAE (+971)", name: "United Arab Emirates" },
  { code: "+90", label: "Turkey (+90)", name: "Turkey" },
  { code: "+98", label: "Iran (+98)", name: "Iran" },
  { code: "+92", label: "Pakistan (+92)", name: "Pakistan" },
  { code: "+880", label: "Bangladesh (+880)", name: "Bangladesh" },
  { code: "+94", label: "Sri Lanka (+94)", name: "Sri Lanka" },
  { code: "+977", label: "Nepal (+977)", name: "Nepal" },
  { code: "+975", label: "Bhutan (+975)", name: "Bhutan" },
  { code: "+93", label: "Afghanistan (+93)", name: "Afghanistan" },
  { code: "+996", label: "Kyrgyzstan (+996)", name: "Kyrgyzstan" },
  { code: "+998", label: "Uzbekistan (+998)", name: "Uzbekistan" },
  { code: "+992", label: "Tajikistan (+992)", name: "Tajikistan" },
  { code: "+993", label: "Turkmenistan (+993)", name: "Turkmenistan" },
  { code: "+7", label: "Kazakhstan (+7)", name: "Kazakhstan" },
  { code: "+374", label: "Armenia (+374)", name: "Armenia" },
  { code: "+994", label: "Azerbaijan (+994)", name: "Azerbaijan" },
  { code: "+995", label: "Georgia (+995)", name: "Georgia" },
];

export function SearchableCountrySelect({
  value,
  onValueChange,
  placeholder = "Select country",
  className,
}: SearchableCountrySelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filteredCountries, setFilteredCountries] = React.useState(countries);

  React.useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredCountries(countries);
    } else {
      const filtered = countries.filter((country) =>
        country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        country.label.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCountries(filtered);
    }
  }, [searchTerm]);

  const selectedCountry = countries.find((country) => country.code === value);

  const handleSelect = (countryCode: string) => {
    onValueChange(countryCode);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className={cn("relative", className)}>
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={isOpen}
        className="w-full justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedCountry ? selectedCountry.label : placeholder}
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search countries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-60 overflow-auto">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => (
                <button
                  key={`${country.code}-${country.name}`}
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center justify-between"
                  onClick={() => handleSelect(country.code)}
                >
                  <span>{country.label}</span>
                  {value === country.code && (
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

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
