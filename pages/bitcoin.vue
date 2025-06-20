<template>
  <div class="max-w-5xl mx-auto mt-10">
    <client-only>
      <PriceChart />
    </client-only>
  </div>
</template>

<script setup>
import PriceChart from "~/components/PriceChart.vue";
</script>
