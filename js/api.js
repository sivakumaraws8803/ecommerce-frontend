"use strict";

async function loadTechStoreProducts() {
    const fallbackProducts = [
        {
            id: "demo-1",
            name: "iPhone 17",
            category: "Phones",
            price: 79900,
            description: "A beautiful smartphone for everyday life.",
            emoji: "📱",
            color: "#e9e4f5",
            tag: "Featured",
            image_url: ""
        },
        {
            id: "demo-2",
            name: "Studio Headphones",
            category: "Audio",
            price: 14990,
            description: "Enjoy your music in comfort and clarity.",
            emoji: "🎧",
            color: "#e8e1f2",
            tag: "Popular",
            image_url: ""
        }
    ];

    try {
        const response = await fetch("/api/products", {
            headers: { Accept: "application/json" }
        });

        if (!response.ok) {
            throw new Error("Product API returned HTTP " + response.status);
        }

        const data = await response.json();

        if (!Array.isArray(data.products)) {
            throw new Error("Unexpected product API response");
        }

        const uniqueProducts = new Map();

        data.products.forEach(function (item) {
            const id = String(item.id);
            if (uniqueProducts.has(id)) return;

            const rawImage = String(item.image_url || "");
            const imageUrl = (/^https?:\/\//i.test(rawImage) || rawImage.startsWith("/uploads/")) ? rawImage : "";

            const category = String(item.category || "Accessories");
            uniqueProducts.set(id, {
                id: id,
                name: String(item.name || "Product"),
                brand: String(item.brand || ""),
                discount_percent: Number(item.discount_percent) || 0,
                category: /^(mobiles|phones|smartphones)$/i.test(category)
                    ? "Phones"
                    : category,
                price: Number(item.price) || 0,
                description: String(item.description || ""),
                emoji: "📦",
                color: "#e9e9ee",
                tag: "",
                image_url: imageUrl
            });
        });

        return uniqueProducts.size ? Array.from(uniqueProducts.values()) : fallbackProducts;
    } catch (error) {
        console.error("Unable to load TechStore products:", error);
        return fallbackProducts;
    }
}
