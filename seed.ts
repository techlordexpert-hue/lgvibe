import type { Course } from "./types";

const net = [
  { id: "u1", title: "Unit 1: Foundations", topics: [
    { id: "t1", title: "What is data communication?", youtube: "", summary:
`# Data communication
Data communication is the exchange of data between two devices through a transmission medium.
- **Five components:** message, sender, receiver, medium, protocol.
- **Delivery:** correct destination, accurate data, timely arrival, minimal jitter.
- **Transmission modes:** simplex (one way), half-duplex (both ways, one at a time), full-duplex (both ways at once).` },
    { id: "t2", title: "Network types and topologies", youtube: "", summary:
`# Network types
A LAN covers a small area such as a lab, a WAN spans cities or countries, and a MAN covers a campus or city.
# Topologies
- **Bus:** one shared backbone cable.
- **Star:** every device connects to a central switch or hub.
- **Ring:** each device connects to two neighbours.
- **Mesh:** devices have many direct links, which gives high redundancy.` },
  ] },
  { id: "u2", title: "Unit 2: Models and protocols", topics: [
    { id: "t3", title: "The OSI model", youtube: "", summary:
`# OSI model
The OSI model has seven layers that standardise how data moves across a network.
1. Physical
2. Data link
3. Network
4. Transport
5. Session
6. Presentation
7. Application
A switch works at layer 2 and a router works at layer 3.` },
    { id: "t4", title: "TCP/IP and addressing", youtube: "", summary:
`# TCP/IP
TCP/IP is the protocol suite of the internet, with the layers Application, Transport, Internet and Network access.
- **IPv4** addresses are 32 bits long, written as four decimal octets.
- **IPv6** addresses are 128 bits long.
- **TCP** is connection-oriented and reliable, while **UDP** is connectionless and fast.
- **DNS** translates domain names to IP addresses.` },
  ] },
];

const java = [
  { id: "u1", title: "Unit 1: Objects", topics: [
    { id: "t1", title: "Classes and objects", youtube: "", summary:
`# Classes and objects
A class is a blueprint, and an object is an instance of that class.
- Fields hold state and methods define behaviour.
- A constructor initialises a new object.
- Encapsulation means private fields accessed through getters and setters.` },
    { id: "t2", title: "Inheritance and polymorphism", youtube: "", summary:
`# Inheritance
Inheritance lets a subclass reuse and extend a superclass using the extends keyword.
- Method overriding replaces a superclass method in the subclass.
- Polymorphism means a superclass reference can point to any subclass object.
- An abstract class cannot be instantiated and may contain abstract methods.` },
  ] },
];

const q = (id: string, text: string, options: string[], answer: number, explanation: string) => ({ id, q: text, options, answer, explanation });

export function seedCourses(): Course[] {
  const now = Date.now();
  const text = (u: typeof net) => u.flatMap((x) => x.topics.map((t) => t.summary.replace(/[#*]/g, ""))).join("\n");
  return [
    { id: "ictew-353", title: "ICTEW 353: Data Communication and Networking", description: "Core concepts of data communication, topologies, the OSI model and TCP/IP.",
      slideText: text(net), units: net, updatedAt: now, quiz: [
        q("q1", "Which transmission mode allows data in both directions at the same time?", ["Simplex", "Half-duplex", "Full-duplex", "Broadcast"], 2, "Full-duplex allows simultaneous two-way communication."),
        q("q2", "Which topology connects every device to a central switch or hub?", ["Bus", "Star", "Ring", "Mesh"], 1, "In a star topology all devices connect to a central device."),
        q("q3", "How many layers does the OSI model have?", ["4", "5", "6", "7"], 3, "OSI has seven layers, from Physical to Application."),
        q("q4", "At which OSI layer does a router operate?", ["Physical", "Data link", "Network", "Transport"], 2, "Routers forward packets using IP addresses at layer 3."),
        q("q5", "How long is an IPv6 address?", ["32 bits", "64 bits", "128 bits", "256 bits"], 2, "IPv6 addresses are 128 bits long."),
      ] },
    { id: "java-oop", title: "Java OOP", description: "Object-oriented programming in Java: classes, objects, inheritance and polymorphism.",
      slideText: text(java), units: java, updatedAt: now, quiz: [
        q("q1", "What is a class in Java?", ["A running program", "A blueprint for objects", "A variable type only", "A compiler"], 1, "A class is a blueprint from which objects are created."),
        q("q2", "Which keyword makes a subclass inherit from a superclass?", ["implements", "extends", "inherits", "super"], 1, "extends declares inheritance between classes."),
        q("q3", "What does a constructor do?", ["Deletes an object", "Initialises a new object", "Compiles the class", "Prints output"], 1, "A constructor runs when an object is created and sets its initial state."),
        q("q4", "Which concept lets a superclass reference point to a subclass object?", ["Encapsulation", "Polymorphism", "Compilation", "Recursion"], 1, "That is polymorphism."),
      ] },
  ];
}
