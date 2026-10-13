import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { Button, Badge, Input, Card, CardHeader, CardContent, CardFooter } from "@/components/ui";

describe("UI Primitives Component Suite", () => {
  describe("Button", () => {
    it("renders label and default primary classes", () => {
      const html = renderToString(<Button>Checkout</Button>);
      expect(html).toContain("Checkout");
      expect(html).toContain("bg-[#14262B]");
      expect(html).toContain('type="button"');
    });

    it("renders disabled and aria-busy when isLoading is true", () => {
      const html = renderToString(<Button isLoading>Processing</Button>);
      expect(html).toContain("Processing");
      expect(html).toContain('aria-busy="true"');
      expect(html).toContain("disabled");
      expect(html).toContain("Loading...");
    });

    it("supports danger variant and custom sizes", () => {
      const html = renderToString(
        <Button variant="danger" size="lg">
          Delete Item
        </Button>
      );
      expect(html).toContain("bg-red-600");
      expect(html).toContain("px-6");
    });
  });

  describe("Badge", () => {
    it("renders status variants with accessible contrast classes", () => {
      const successHtml = renderToString(<Badge variant="success">In Stock</Badge>);
      expect(successHtml).toContain("In Stock");
      expect(successHtml).toContain("text-emerald-800");

      const warningHtml = renderToString(<Badge variant="warning">Low Stock</Badge>);
      expect(warningHtml).toContain("Low Stock");
      expect(warningHtml).toContain("text-amber-800");
    });
  });

  describe("Input", () => {
    it("renders label and connects input via id", () => {
      const html = renderToString(
        <Input id="email-field" label="Email Address" placeholder="alex@example.com" />
      );
      expect(html).toContain('for="email-field"');
      expect(html).toContain('id="email-field"');
      expect(html).toContain("Email Address");
    });

    it("renders aria-invalid and error message with alert role", () => {
      const html = renderToString(
        <Input id="postal-code" label="ZIP Code" error="Invalid ZIP code" />
      );
      expect(html).toContain('aria-invalid="true"');
      expect(html).toContain('aria-describedby="postal-code-error"');
      expect(html).toContain('id="postal-code-error"');
      expect(html).toContain('role="alert"');
      expect(html).toContain("Invalid ZIP code");
    });

    it("renders helper text with aria-describedby when no error", () => {
      const html = renderToString(
        <Input id="phone" label="Phone" helperText="We only use this for delivery SMS" />
      );
      expect(html).toContain('aria-describedby="phone-helper"');
      expect(html).toContain('id="phone-helper"');
      expect(html).toContain("We only use this for delivery SMS");
    });
  });

  describe("Card", () => {
    it("renders structured card components", () => {
      const html = renderToString(
        <Card>
          <CardHeader>Card Header Title</CardHeader>
          <CardContent>Body Content Here</CardContent>
          <CardFooter>Footer Content</CardFooter>
        </Card>
      );
      expect(html).toContain("Card Header Title");
      expect(html).toContain("Body Content Here");
      expect(html).toContain("Footer Content");
    });
  });
});
