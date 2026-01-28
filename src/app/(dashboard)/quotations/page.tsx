import { redirect } from "next/navigation";

export default function QuotationsIndexPage() {
    redirect("/quotations/create");
}
