import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testParameterParams() {
    try {
        console.log("Fetching active parameters...");
        const { data: parameters, error: fetchErr } = await supabase
            .from("parameters")
            .select("*")
            .eq("is_active", true)
            .limit(1);

        if (fetchErr) {
            console.error("Fetch error:", fetchErr);
            return;
        }

        if (!parameters || parameters.length === 0) {
            console.log("No active parameters found.");
            return;
        }

        const param = parameters[0];
        console.log("Testing edit on parameter:", param.id, param.name);

        const { data: updated, error: updateErr } = await supabase
            .from("parameters")
            .update({ name: param.name + " (Test)" })
            .eq("id", param.id)
            .select()
            .single();

        if (updateErr) {
            console.error("Update error:", updateErr);
            return;
        }
        console.log("Update success!");

        console.log("Reverting edit...");
        const { error: revertErr } = await supabase
            .from("parameters")
            .update({ name: param.name })
            .eq("id", param.id);

        if (revertErr) {
            console.error("Revert error:", revertErr);
        } else {
            console.log("Revert success!");
        }

    } catch (e) {
        console.error("Unexpected error:", e);
    }
}

testParameterParams();
