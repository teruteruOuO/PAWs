<template>
<header class="header-component">
    <h1>This is the header</h1>
</header>
</template>

<script setup>
</script>

<style scoped>
/* Phone Horizontal */
@media screen and (min-width: 576px) {
    header {
        grid-template-areas: 
        "h1 nav";
    }
}

/* Laptop */
@media screen and (min-width: 768px) {

}

/* Desktop */
@media screen and (min-width: 1024px) {

}

/* Large Desktop */
@media screen and (min-width: 1200px) {

}
</style>