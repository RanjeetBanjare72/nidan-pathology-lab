import { supabase } from "./supabase";

function parseOptions(value) {
  if (value === null || value === undefined || value === "") return [];
  if (typeof value === "object") return value;
  try { return JSON.parse(value); } catch { return value; }
}

function normalizeParameter(parameter) {
  const min = parameter.min_value === null || parameter.min_value === "" ? null : Number(parameter.min_value);
  const max = parameter.max_value === null || parameter.max_value === "" ? null : Number(parameter.max_value);
  return {
    ...parameter,
    id: String(parameter.id),
    name: parameter.parameter_name || parameter.name || "",
    parameter_name: parameter.parameter_name || parameter.name || "",
    unit: parameter.unit || "",
    min: Number.isFinite(min) ? min : null,
    max: Number.isFinite(max) ? max : null,
    min_value: parameter.min_value,
    max_value: parameter.max_value,
    range: parameter.reference_range || "",
    reference_range: parameter.reference_range || "",
    options: parseOptions(parameter.options),
    sort_order: parameter.sort_order ?? 1,
    active: parameter.active !== false,
  };
}

export async function loadDatabaseTests() {
  const { data: tests, error: testsError } = await supabase
    .from("tests")
    .select("*")
    .eq("active", true)
    .order("name", { ascending: true });

  if (testsError) throw testsError;

  const ids = (tests || []).map((t) => t.id);
  if (!ids.length) return [];

  const [{ data: parameters, error: parameterError }, { data: prices, error: priceError }] = await Promise.all([
    supabase.from("test_parameters").select("*").in("test_id", ids).eq("active", true).order("sort_order", { ascending: true }),
    supabase.from("test_prices").select("*").in("test_id", ids).eq("is_active", true),
  ]);

  if (parameterError) throw parameterError;
  if (priceError) throw priceError;

  return (tests || []).map((test) => {
    const testParameters = (parameters || [])
      .filter((p) => String(p.test_id) === String(test.id))
      .map(normalizeParameter);
    const priceRows = (prices || []).filter((p) => String(p.test_id) === String(test.id));
    const currentPrice = priceRows.length ? Number(priceRows[0].price || 0) : Number(test.price || 0);

    return {
      ...test,
      id: String(test.id),
      name: test.name || "",
      short: test.short_name || test.short || test.name || "",
      price: currentPrice,
      category: test.category || "Other",
      icon: test.icon || "🧪",
      tests: testParameters,
      parameters: testParameters,
      source: "supabase",
    };
  });
}
