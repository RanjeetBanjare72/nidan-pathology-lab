import { supabase } from "./supabase";

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
    const testParameters = (parameters || []).filter((p) => String(p.test_id) === String(test.id));
    const priceRows = (prices || []).filter((p) => String(p.test_id) === String(test.id));
    const currentPrice = priceRows.length ? Number(priceRows[0].price || 0) : Number(test.price || 0);

    return {
      ...test,
      id: String(test.id),
      price: currentPrice,
      tests: testParameters,
      parameters: testParameters,
      source: "supabase",
    };
  });
}
