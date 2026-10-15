# ParkPulse - Smart Parking Management System

A production-grade, responsive **Smart Parking Management System** built with React, TypeScript, Vite, and Tailwind CSS for an Advanced Data Structures (ASD) project.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (version 18 or higher recommended)
- npm (Node Package Manager)

### Installation & Local Setup

1. **Clone or navigate into the project directory:**
   ```bash
   cd smart-parking-system
   ```

2. **Install all dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000` to interact with the live application.

5. **Build for production (optional):**
   ```bash
   npm run build
   ```

---

## 🌟 Key Application Features

1. **Interactive Dashboard:**
   - Real-time statistics: Total Bays (48), Available, Occupied, Reserved, Maintenance, Active Vehicles, Occupancy Rate %, and Today's Tariff Revenue.
   - Live zone-by-zone capacity meters with multi-colored occupancy bars.
   - Quick operational action shortcuts for instant entry, exit, and reservation.

2. **Parking Availability Management:**
   - 48 physical spaces uniquely labeled across 4 Zones (A-01 to A-12, B-01 to B-12, C-01 to C-12, D-01 to D-12):
     - **Zone A (North Wing - Ground Floor):** Designated accessible bays near admin elevators and electric vehicle charging bays.
     - **Zone B (South Courtyard - Ground Floor):** Fast egress to South Highway Express.
     - **Zone C (Green Mobility Hub - Level 1):** Dedicated high-speed EV charging stations.
     - **Zone D (Two-Wheeler & General - Level 2 Rooftop):** Compact shaded bays for motorcycles and scooters.
   - **Strict Status Color Coding:**
     - 🟢 **Green** for **Available** spaces
     - 🔴 **Red** for **Occupied** spaces
     - 🟣 **Purple** for **Reserved** spaces
     - ⚪ **Gray** for **Maintenance** spaces
   - **Manual Status Management:**
     - Change the status of any parking space directly using the dropdown on the card or in the management table.
     - Mark a space as Available, Occupied, Reserved, or Maintenance.
     - **Invalid Change Prevention:** If a vehicle is currently parked in a space, marking it available directly without checkout is prevented with an actionable confirmation dialog to record billing and checkout cleanly.
     - Real-time synchronization across the Dashboard and all tabs via browser `LocalStorage`.
   - **View Toggle:** Switch between **Visual Grid** and **Management Table** views.

3. **Vehicle Check-In (Entry) & Check-Out (Exit):**
   - **Entry:** Captures vehicle license plate, category (Two-Wheeler, Four-Wheeler, EV, Accessible), driver contact, and entrance gate. Automatically assigns the closest optimal bay using **MinHeap** and **Dijkstra's shortest path**.
   - **Duplicate Prevention:** Uses an O(1) **Custom HashMap** to prevent duplicate license plate check-ins.
   - **Printable Parking Ticket Pass:** Generates a realistic pass with barcode and QR visualization, timestamp, tariff rate, and bay directions.
   - **Exit & Billing:** Live duration calculation, flexible payment processing (Card, Digital UPI, Cash, Campus ID Pass), and instant slot release.
   - **Automatic Queue Dispatch:** Immediately triggers the FIFO waiting queue when a bay is vacated to assign waiting vehicles!

4. **Reservations Management:**
   - Pre-book parking spaces in advance for guests, faculty, or planned arrivals.
   - Live remaining time countdown and one-click "Check-In" to transition a reservation into an active parking session.

5. **Waiting Queue (FIFO Buffer):**
   - When slots of a specific category are full, arriving vehicles can join the waiting queue.
   - Features queue position numbering, wait duration timers, and automated or manual bay allocation upon vacancy.

6. **Find Parking & Shortest Path Navigation:**
   - Interactive recommendation engine filtering by vehicle category, entrance gate (Gate 1 North or Gate 2 South), EV needs, and accessibility.
   - **Dijkstra Shortest Path Graph Visualization:** Highlights the physical route from Gate $\to$ Rotunda $\to$ Lane $\to$ Bay with distance in meters and turn-by-turn driving instructions.

7. **Parking History & Audit Log:**
   - Complete record of past sessions with ticket IDs, plates, durations, fees, and payment status.
   - Custom sorting powered by **QuickSort** and **MergeSort** (by exit time, duration, fee, or license plate).
   - Export parking records directly to CSV.

8. **Analytics & Utilization:**
   - Zone-by-zone utilization, vehicle type share, simulated hourly traffic peak curves (07:00 AM – 07:00 PM), and revenue metrics.

---

## 🧠 Advanced Data Structures Implemented

- **`Queue<T>` (`src/data-structures/Queue.ts`):** Linked-list based FIFO Queue for waiting vehicle buffer with O(1) enqueue and dequeue operations.
- **`CustomHashMap<K, V>` (`src/data-structures/HashMap.ts`):** Hash table with polynomial rolling hash and separate chaining collision resolution for O(1) vehicle plate lookup and duplicate prevention.
- **`MinHeap<T>` (`src/data-structures/MinHeap.ts`):** Generic Binary Min-Heap Priority Queue used for priority queue operations in Dijkstra's algorithm and nearest bay allocation.
- **`ParkingGraph` & Dijkstra (`src/data-structures/Graph.ts`):** Weighted adjacency list graph with Dijkstra's shortest-path algorithm to calculate shortest driving routes from entrance gates to parking bays.
- **Searching & Sorting (`src/data-structures/Algorithms.ts`):** Generic QuickSort and MergeSort algorithms for sorting transaction logs and Binary Search for plate lookups.

---

## 💾 LocalStorage Persistence
All parking bay statuses, active vehicle sessions, reservations, waiting queues, and historical records are preserved across page refreshes via browser `localStorage`. A "Reset Data" option is accessible at any time from the top navigation bar.
