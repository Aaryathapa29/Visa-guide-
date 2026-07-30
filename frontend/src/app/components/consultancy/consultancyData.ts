export interface Consultancy {
  id: number;
  name: string;
  logo: string;
  rating: number;
  experience: string;
  countries: string[];
  universities: string[];
  services: string[];
  address: string;
  phone: string;
  email: string;
  website: string;
}

export const consultancies: Consultancy[] = [
  {
    id: 1,
    name: "Global Education Consultancy",
    logo: "/images/global.png",
    rating: 4.8,
    experience: "12 Years",
    countries: ["USA", "Canada", "Australia", "UK", "Japan"],
    universities: [
      "University of Toronto",
      "University of Melbourne"
    ],
    services: [
      "Student Visa",
      "University Admission",
      "SOP Review",
      "Scholarship Guidance",
      "Interview Preparation"
    ],
    address: "Putalisadak, Kathmandu",
    phone: "+977-9800000001",
    email: "info@globaledu.com",
    website: "www.globaledu.com"
  },
  {
    id: 2,
    name: "Future Path Consultancy",
    logo: "/images/futurepath.png",
    rating: 4.6,
    experience: "9 Years",
    countries: ["USA", "Canada", "Australia", "New Zealand", "Japan"],
    universities: [
      "University of Sydney",
      "University of British Columbia"
    ],
    services: [
      "Visa Counseling",
      "Application Processing",
      "Documentation",
      "Mock Interviews",
      "Career Guidance"
    ],
    address: "New Baneshwor, Kathmandu",
    phone: "+977-9800000002",
    email: "contact@futurepath.com",
    website: "www.futurepath.com"
  }
];