<template>
  <div
    class="p-6 bg-gradient-to-r from-white via-slate-50 to-white shadow-xl border border-slate-200 rounded-2xl"
  >
    <div class="flex flex-wrap items-center justify-between mb-6 gap-4">
      <h2 class="text-2xl font-semibold text-slate-800">
        Bitcoin Price History
      </h2>

      <div class="flex flex-wrap gap-2 items-center">
        <select
          v-model="selectedRange"
          @change="onRangeChange"
          class="border border-slate-300 px-3 py-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="1d">1 Day</option>
          <option value="1w">1 Week</option>
          <option value="1m">1 Month</option>
          <option value="1y">1 Year</option>
          <option value="custom">Custom</option>
        </select>

        <div v-if="selectedRange === 'custom'" class="flex gap-2">
          <input
            type="date"
            v-model="customFrom"
            class="border p-2 rounded-lg"
          />
          <input type="date" v-model="customTo" class="border p-2 rounded-lg" />
          <button
            @click="fetchData"
            class="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg shadow"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
    <div class="mt-4 text-sm text-gray-500 dark:text-gray-400">
      Source:
      <a
        :href="sourceLink"
        target="_blank"
        rel="noopener noreferrer"
        class="text-emerald-600 hover:underline"
      >
        {{ sourceLink }}
      </a>
    </div>
    <!-- Chart Scroll Wrapper -->
    <div class="overflow-x-auto">
      <div :style="canvasStyle">
        <Line v-if="chartData" :data="chartData" :options="chartOptions" />
        <p v-else>Loading chart...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
} from "chart.js";
import { Line } from "vue-chartjs";
import { ref, onMounted, watch } from "vue";
import { useFetch } from "#app";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement
);

const canvasStyle = computed(() => {
  const len = chartData.value?.labels?.length || 0;
  const minWidth = len > 10 ? `${len * 70}px` : "100%"; // 70px per point
  return { width: minWidth, height: "400px" };
});

const selectedRange = ref("1d");
const chartData = ref(null);

const customFrom = ref("");
const customTo = ref("");
const sourceLink = ref("");
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: true },
    tooltip: {
      callbacks: {
        label: (ctx) => ` $${ctx.parsed.y.toFixed(2)}`,
      },
    },
  },
};

const onRangeChange = () => {
  if (selectedRange.value !== "custom") {
    fetchData();
  }
};

const fetchData = async () => {
  let url = "/api/bitcoin/query";
  if (selectedRange.value === "custom") {
    const from = new Date(customFrom.value).getTime();
    const to = new Date(customTo.value).getTime();
    url += `?range=custom&from=${from}&to=${to}`;
  } else {
    url += `?range=${selectedRange.value}`;
  }
  const { data } = await useFetch(url);
  if (!data.value || !data.value.data) return;
  sourceLink.value = data.value.sourceLink;
  chartData.value = {
    labels: data.value.data.map((entry) => entry.date),
    datasets: [
      {
        label: "BTC Price (USD)",
        data: data.value.data.map((entry) => entry.priceUSD),
        borderColor: "#10b981",
        backgroundColor: "rgba(16,185,129,0.2)",
        tension: 0.3,
        fill: true,
        pointRadius: 2,
      },
    ],
  };
};

onMounted(fetchData);
</script>
<style>
/* In your global CSS or Tailwind config */
::-webkit-scrollbar {
  height: 8px;
}
::-webkit-scrollbar-thumb {
  background-color: #888;
  border-radius: 4px;
}
</style>
