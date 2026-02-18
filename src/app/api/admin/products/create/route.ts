import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const {
            name,
            price,
            description,
            howToUse,
            ingredients,
            packaging,
            weight,
            inStock,
            image,
            slug,
            category,
            tagline,
            features,
            benefits,
        } = body;

        if (!name || !slug || price === undefined) {
            return NextResponse.json(
                { error: "Missing required fields: name, slug, price" },
                { status: 400 }
            );
        }

        const productData = {
            name,
            price: Number(price),
            description: description || "",
            howToUse: howToUse || "",
            ingredients: ingredients || [],
            packaging: packaging || "",
            weight: weight || "",
            inStock: inStock !== false,
            image: image || "",
            slug,
            category: category || "lip-care",
            tagline: tagline || "",
            features: features || [],
            benefits: benefits || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const docRef = await adminDb.collection("products").add(productData);

        return NextResponse.json({
            success: true,
            id: docRef.id,
        });
    } catch (error) {
        console.error("Product create error:", error);
        return NextResponse.json(
            { error: "Failed to create product" },
            { status: 500 }
        );
    }
}
