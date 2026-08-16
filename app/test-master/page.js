"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

/* =========================================================
   CONSTANTS
========================================================= */

const CATEGORIES = [
  "Hematology",
  "Biochemistry",
  "Serology",
  "Clinical Pathology",
  "Hormone",
  "Coagulation",
  "Microbiology",
  "Immunology",
  "Other",
];

const EMPTY_TEST = {
  name: "",
  short_name: "",
  category: "Hematology",
  department: "Laboratory",
  sample_type: "",
  price: "",
  method: "",
  active: true,
};

const EMPTY_PARAMETER = {
  parameter_name: "",
  unit: "",
  min_value: "",
  max_value: "",
  reference_range: "",
  options: "",
  sort_order: 1,
  active: true,
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function TestMasterPage() {
  const router = useRouter();

  /* ---------------- TESTS ---------------- */

  const [tests, setTests] = useState([]);
  const [prices, setPrices] = useState([]);

  /* ---------------- PARAMETERS ---------------- */

  const [parameters, setParameters] = useState([]);

  /* ---------------- UI STATE ---------------- */

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [selectedTest, setSelectedTest] = useState(null);

  /* ---------------- TEST MODAL ---------------- */

  const [showTestForm, setShowTestForm] = useState(false);
  const [editingTestId, setEditingTestId] = useState(null);
  const [testForm, setTestForm] = useState(EMPTY_TEST);

  /* ---------------- PRICE MODAL ---------------- */

  const [showPriceForm, setShowPriceForm] = useState(false);
  const [priceTest, setPriceTest] = useState(null);
  const [priceValue, setPriceValue] = useState("");

  /* ---------------- PARAMETER MODAL ---------------- */

  const [showParameterForm, setShowParameterForm] =
    useState(false);

  const [editingParameterId, setEditingParameterId] =
    useState(null);

  const [parameterForm, setParameterForm] =
    useState(EMPTY_PARAMETER);

  /* =========================================================
     LOAD TESTS
  ========================================================= */

  async function loadTests() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("tests")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;

      setTests(data || []);
    } catch (error) {
      console.error("Test loading error:", error);

      alert(
        "Tests load nahi ho paaye: " +
          error.message
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     LOAD PRICES
  ========================================================= */

  async function loadPrices() {
    try {
      const { data, error } = await supabase
        .from("test_prices")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      if (error) throw error;

      setPrices(data || []);
    } catch (error) {
      console.error("Price loading error:", error);

      /*
        Agar test_prices table accessible nahi hai,
        tests.price se application phir bhi chalegi.
      */

      setPrices([]);
    }
  }

  /* =========================================================
     GET CURRENT PRICE
  ========================================================= */

  function getTestPrice(test) {
    const matchingPrices = prices.filter(
      (item) =>
        String(item.test_id) === String(test.id) &&
        item.is_active !== false
    );

    if (matchingPrices.length > 0) {
      return Number(
        matchingPrices[0].price || 0
      );
    }

    return Number(test.price || 0);
  }

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    async function init() {
      await Promise.all([
        loadTests(),
        loadPrices(),
      ]);
    }

    init();
  }, []);

  /* =========================================================
     LOAD PARAMETERS
  ========================================================= */

  async function loadParameters(testId) {
    if (!testId) {
      setParameters([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("test_parameters")
        .select("*")
        .eq("test_id", testId)
        .order("sort_order", {
          ascending: true,
        });

      if (error) throw error;

      setParameters(data || []);
    } catch (error) {
      console.error(
        "Parameter loading error:",
        error
      );

      alert(
        "Parameters load nahi ho paaye: " +
          error.message
      );

      setParameters([]);
    }
  }

  /* =========================================================
     REFRESH
  ========================================================= */

  async function refreshAll() {
    await Promise.all([
      loadTests(),
      loadPrices(),
    ]);

    if (selectedTest?.id) {
      await loadParameters(selectedTest.id);
    }
  }

  /* =========================================================
     OPEN NEW TEST
  ========================================================= */

  function openNewTest() {
    setEditingTestId(null);
    setTestForm({
      ...EMPTY_TEST,
    });

    setSelectedTest(null);
    setParameters([]);

    setShowTestForm(true);
    setShowParameterForm(false);
    setShowPriceForm(false);
  }

  /* =========================================================
     EDIT TEST
  ========================================================= */

  async function editTest(test) {
    setEditingTestId(test.id);

    setTestForm({
      name: test.name || "",
      short_name: test.short_name || "",
      category:
        test.category || "Hematology",
      department:
        test.department || "Laboratory",
      sample_type:
        test.sample_type || "",
      price:
        test.price === null ||
        test.price === undefined
          ? ""
          : String(test.price),
      method: test.method || "",
      active:
        test.active === undefined
          ? true
          : test.active,
    });

    setSelectedTest(test);

    setShowTestForm(true);
    setShowParameterForm(false);
    setShowPriceForm(false);

    await loadParameters(test.id);
  }

  /* =========================================================
     SAVE TEST
  ========================================================= */

  async function saveTest(event) {
    event.preventDefault();

    if (!testForm.name.trim()) {
      alert("Test name zaroori hai.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: testForm.name.trim(),
        short_name:
          testForm.short_name.trim(),
        category: testForm.category,
        department:
          testForm.department.trim(),
        sample_type:
          testForm.sample_type.trim(),

        price:
          testForm.price === ""
            ? 0
            : Number(testForm.price),

        method: testForm.method.trim(),
        active: testForm.active,

        updated_at:
          new Date().toISOString(),
      };

      if (editingTestId) {
        const { data, error } =
          await supabase
            .from("tests")
            .update(payload)
            .eq("id", editingTestId)
            .select()
            .single();

        if (error) throw error;

        setSelectedTest(data);

        alert("Test successfully updated.");
      } else {
        const { data, error } =
          await supabase
            .from("tests")
            .insert([payload])
            .select()
            .single();

        if (error) throw error;

        setSelectedTest(data);
        setEditingTestId(data.id);

        alert(
          "New test successfully added."
        );
      }

      await loadTests();

      setShowTestForm(false);
    } catch (error) {
      console.error(
        "Test save error:",
        error
      );

      alert(
        "Test save nahi hua: " +
          error.message
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     DELETE TEST
  ========================================================= */

  async function deleteTest(test) {
    const ok = window.confirm(
      `Kya "${test.name}" ko delete karna hai?\n\nIs test ke saare parameters aur price records bhi delete honge.`
    );

    if (!ok) return;

    try {
      setSaving(true);

      /* Delete parameters */

      const {
        error: parameterError,
      } = await supabase
        .from("test_parameters")
        .delete()
        .eq("test_id", test.id);

      if (parameterError) {
        throw parameterError;
      }

      /* Delete prices */

      const {
        error: priceError,
      } = await supabase
        .from("test_prices")
        .delete()
        .eq("test_id", String(test.id));

      /*
        Agar price delete policy issue ho,
        test delete ko unnecessarily block
        nahi karenge.
      */

      if (priceError) {
        console.warn(
          "Price delete warning:",
          priceError
        );
      }

      /* Delete test */

      const { error } = await supabase
        .from("tests")
        .delete()
        .eq("id", test.id);

      if (error) throw error;

      if (
        selectedTest?.id === test.id
      ) {
        setSelectedTest(null);
        setParameters([]);
      }

      await loadTests();
      await loadPrices();

      alert(
        "Test deleted successfully."
      );
    } catch (error) {
      console.error(
        "Delete test error:",
        error
      );

      alert(
        "Test delete nahi hua: " +
          error.message
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     TOGGLE TEST ACTIVE
  ========================================================= */

  async function toggleActive(test) {
    try {
      const { error } = await supabase
        .from("tests")
        .update({
          active: !test.active,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", test.id);

      if (error) throw error;

      await loadTests();

      if (
        selectedTest?.id === test.id
      ) {
        setSelectedTest({
          ...selectedTest,
          active: !test.active,
        });
      }
    } catch (error) {
      alert(
        "Status update nahi hua: " +
          error.message
      );
    }
  }

  /* =========================================================
     OPEN PRICE MODAL
  ========================================================= */

  function openPriceEditor(test) {
    setPriceTest(test);

    setPriceValue(
      String(getTestPrice(test))
    );

    setShowPriceForm(true);
    setShowTestForm(false);
    setShowParameterForm(false);
  }

  /* =========================================================
     SAVE PRICE
  ========================================================= */

  async function savePrice(event) {
    event.preventDefault();

    if (!priceTest) {
      alert("Test select karein.");
      return;
    }

    const numericPrice =
      Number(priceValue);

    if (
      Number.isNaN(numericPrice) ||
      numericPrice < 0
    ) {
      alert(
        "Valid price enter karein."
      );
      return;
    }

    try {
      setSaving(true);

      const testId =
        String(priceTest.id);

      /*
        Existing active price find karein.
      */

      const {
        data: existing,
        error: findError,
      } = await supabase
        .from("test_prices")
        .select("*")
        .eq("test_id", testId)
        .eq("is_active", true)
        .order("created_at", {
          ascending: false,
        })
        .limit(1);

      if (findError) {
        throw findError;
      }

      if (
        existing &&
        existing.length > 0
      ) {
        /*
          Existing price update
        */

        const {
          error: updateError,
        } = await supabase
          .from("test_prices")
          .update({
            price: numericPrice,
            test_name:
              priceTest.name,
            category:
              priceTest.category,
            is_active: true,
            updated_at:
              new Date().toISOString(),
          })
          .eq("id", existing[0].id);

        if (updateError) {
          throw updateError;
        }
      } else {
        /*
          No price record:
          New price insert
        */

        const {
          error: insertError,
        } = await supabase
          .from("test_prices")
          .insert([
            {
              test_id: testId,
              test_name:
                priceTest.name,
              category:
                priceTest.category,
              price: numericPrice,
              is_active: true,
            },
          ]);

        if (insertError) {
          throw insertError;
        }
      }

      /*
        tests table ka price bhi sync
        kar dete hain.
      */

      const {
        error: testUpdateError,
      } = await supabase
        .from("tests")
        .update({
          price: numericPrice,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", priceTest.id);

      if (testUpdateError) {
        console.warn(
          "Tests price sync warning:",
          testUpdateError
        );
      }

      await loadTests();
      await loadPrices();

      setShowPriceForm(false);

      alert(
        "Test price successfully updated."
      );
    } catch (error) {
      console.error(
        "Price save error:",
        error
      );

      alert(
        "Price save nahi hua: " +
          error.message
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     SELECT TEST
  ========================================================= */

  async function selectTest(test) {
    setSelectedTest(test);

    setShowTestForm(false);
    setShowPriceForm(false);
    setShowParameterForm(false);

    await loadParameters(test.id);
  }

  /* =========================================================
     NEW PARAMETER
  ========================================================= */

  function openNewParameter() {
    if (!selectedTest) {
      alert(
        "Pehle ek test select karein."
      );
      return;
    }

    setEditingParameterId(null);

    setParameterForm({
      ...EMPTY_PARAMETER,
      sort_order:
        parameters.length + 1,
    });

    setShowParameterForm(true);
    setShowTestForm(false);
    setShowPriceForm(false);
  }

  /* =========================================================
     EDIT PARAMETER
  ========================================================= */

  function editParameter(parameter) {
    setEditingParameterId(
      parameter.id
    );

    let optionText = "";

    if (parameter.options) {
      try {
        optionText =
          JSON.stringify(
            parameter.options,
            null,
            2
          );
      } catch {
        optionText = String(
          parameter.options
        );
      }
    }

    setParameterForm({
      parameter_name:
        parameter.parameter_name ||
        "",

      unit:
        parameter.unit || "",

      min_value:
        parameter.min_value ===
          null ||
        parameter.min_value ===
          undefined
          ? ""
          : String(
              parameter.min_value
            ),

      max_value:
        parameter.max_value ===
          null ||
        parameter.max_value ===
          undefined
          ? ""
          : String(
              parameter.max_value
            ),

      /*
        यही Normal / Reference Value
        है जिसे अब आसानी से बदल सकते हैं.
      */

      reference_range:
        parameter.reference_range ||
        "",

      options: optionText,

      sort_order:
        parameter.sort_order || 1,

      active:
        parameter.active ===
          undefined
          ? true
          : parameter.active,
    });

    setShowParameterForm(true);
    setShowTestForm(false);
    setShowPriceForm(false);
  }

  /* =========================================================
     SAVE PARAMETER
  ========================================================= */

  async function saveParameter(event) {
    event.preventDefault();

    if (!selectedTest) {
      alert(
        "Pehle test select karein."
      );
      return;
    }

    if (
      !parameterForm.parameter_name.trim()
    ) {
      alert(
        "Parameter name zaroori hai."
      );
      return;
    }

    try {
      setSaving(true);

      let options = {};

      /*
        Options JSON ya simple text
      */

      if (
        parameterForm.options.trim()
      ) {
        try {
          options = JSON.parse(
            parameterForm.options
          );
        } catch {
          options = {
            text:
              parameterForm.options.trim(),
          };
        }
      }

      const payload = {
        test_id: selectedTest.id,

        parameter_name:
          parameterForm.parameter_name.trim(),

        unit:
          parameterForm.unit.trim(),

        min_value:
          parameterForm.min_value ===
          ""
            ? null
            : Number(
                parameterForm.min_value
              ),

        max_value:
          parameterForm.max_value ===
          ""
            ? null
            : Number(
                parameterForm.max_value
              ),

        /*
          NORMAL / REFERENCE VALUE
          --------------------------------
          Example:
          Male: 13-17 g/dL
          Female: 12-15 g/dL
        */

        reference_range:
          parameterForm.reference_range.trim(),

        options,

        sort_order:
          Number(
            parameterForm.sort_order
          ) || 1,

        active:
          parameterForm.active,

        updated_at:
          new Date().toISOString(),
      };

      if (editingParameterId) {
        /*
          UPDATE EXISTING PARAMETER
        */

        const {
          error,
        } = await supabase
          .from("test_parameters")
          .update(payload)
          .eq(
            "id",
            editingParameterId
          );

        if (error) throw error;

        alert(
          "Parameter successfully updated."
        );
      } else {
        /*
          ADD NEW PARAMETER
        */

        const {
          error,
        } = await supabase
          .from("test_parameters")
          .insert([payload]);

        if (error) throw error;

        alert(
          "Parameter successfully added."
        );
      }

      await loadParameters(
        selectedTest.id
      );

      setShowParameterForm(false);
      setEditingParameterId(null);

      setParameterForm({
        ...EMPTY_PARAMETER,
      });
    } catch (error) {
      console.error(
        "Parameter save error:",
        error
      );

      alert(
        "Parameter save nahi hua: " +
          error.message
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     DELETE PARAMETER
  ========================================================= */

  async function deleteParameter(
    parameter
  ) {
    const ok = window.confirm(
      `Kya "${parameter.parameter_name}" parameter delete karna hai?`
    );

    if (!ok) return;

    try {
      setSaving(true);

      const {
        error,
      } = await supabase
        .from("test_parameters")
        .delete()
        .eq("id", parameter.id);

      if (error) throw error;

      await loadParameters(
        selectedTest.id
      );

      alert(
        "Parameter deleted successfully."
      );
    } catch (error) {
      console.error(
        "Parameter delete error:",
        error
      );

      alert(
        "Parameter delete nahi hua: " +
          error.message
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     TOGGLE PARAMETER ACTIVE
  ========================================================= */

  async function toggleParameterActive(
    parameter
  ) {
    try {
      const {
        error,
      } = await supabase
        .from("test_parameters")
        .update({
          active:
            !parameter.active,
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          parameter.id
        );

      if (error) throw error;

      await loadParameters(
        selectedTest.id
      );
    } catch (error) {
      alert(
        "Parameter status update nahi hua: " +
          error.message
      );
    }
  }

  /* =========================================================
     FILTER TESTS
  ========================================================= */

  const filteredTests = useMemo(() => {
    const text =
      search.toLowerCase().trim();

    return tests.filter((test) => {
      const matchesSearch =
        !text ||
        test.name
          ?.toLowerCase()
          .includes(text) ||
        test.short_name
          ?.toLowerCase()
          .includes(text) ||
        test.category
          ?.toLowerCase()
          .includes(text) ||
        test.sample_type
          ?.toLowerCase()
          .includes(text);

      const matchesCategory =
        category === "All" ||
        test.category === category;

      return (
        matchesSearch &&
        matchesCategory
      );
    });
  }, [
    tests,
    search,
    category,
  ]);

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div style={pageStyle}>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <header style={headerStyle}>
        <div>
          <div
            style={{
              fontSize: "10px",
              fontWeight: "900",
              color: "#079b94",
              letterSpacing: "1px",
            }}
          >
            NIDAN PATHOLOGY LAB
          </div>

          <h1
            style={{
              margin: "3px 0",
              fontSize: "23px",
              color: "#172536",
            }}
          >
            Test Master
          </h1>

          <p
            style={{
              margin: 0,
              color: "#718096",
              fontSize: "11px",
            }}
          >
            Tests, prices, parameters &
            reference ranges manage karein
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "7px",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() =>
              router.push("/")
            }
            style={buttonStyle(
              "#ffffff",
              "#334155"
            )}
          >
            ← Dashboard
          </button>

          <button
            onClick={openNewTest}
            style={buttonStyle(
              "#0e9f99",
              "#ffffff"
            )}
          >
            + New Test
          </button>
        </div>
      </header>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main style={mainStyle}>
        {/* SEARCH */}

        <section style={searchCardStyle}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(0, 1fr) 180px",
              gap: "10px",
            }}
          >
            <input
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="🔎 Search investigation / test name..."
              style={inputStyle}
            />

            <select
              value={category}
              onChange={(e) =>
                setCategory(
                  e.target.value
                )
              }
              style={inputStyle}
            >
              <option value="All">
                All Categories
              </option>

              {CATEGORIES.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                )
              )}
            </select>
          </div>
        </section>

        {/* ===================================================
            CONTENT GRID
        =================================================== */}

        <div style={contentGridStyle}>
          {/* =================================================
              TEST LIST
          ================================================= */}

          <section style={cardStyle}>
            <div
              style={{
                padding: "14px",
                borderBottom:
                  "1px solid #e8edf2",
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "17px",
                  }}
                >
                  Laboratory Tests
                </h2>

                <p
                  style={{
                    margin:
                      "4px 0 0",
                    color: "#7b8795",
                    fontSize: "11px",
                  }}
                >
                  {
                    filteredTests.length
                  }{" "}
                  investigations
                </p>
              </div>

              <button
                onClick={
                  refreshAll
                }
                style={smallButton}
              >
                ↻ Refresh
              </button>
            </div>

            {loading ? (
              <div style={emptyStyle}>
                Loading tests...
              </div>
            ) : filteredTests.length ===
              0 ? (
              <div style={emptyStyle}>
                <div
                  style={{
                    fontSize: "35px",
                  }}
                >
                  🧪
                </div>

                <strong>
                  No tests found
                </strong>

                <p>
                  Search clear karein ya
                  + New Test se test add
                  karein.
                </p>
              </div>
            ) : (
              <div>
                {filteredTests.map(
                  (test) => {
                    const selected =
                      selectedTest?.id ===
                      test.id;

                    const currentPrice =
                      getTestPrice(
                        test
                      );

                    return (
                      <div
                        key={test.id}
                        onClick={() =>
                          selectTest(
                            test
                          )
                        }
                        style={{
                          padding:
                            "14px",
                          borderBottom:
                            "1px solid #edf1f5",
                          cursor:
                            "pointer",
                          background:
                            selected
                              ? "#ecfbf9"
                              : "#ffffff",
                        }}
                      >
                        <div
                          style={{
                            display:
                              "flex",
                            justifyContent:
                              "space-between",
                            gap: "10px",
                          }}
                        >
                          {/* TEST INFO */}

                          <div
                            style={{
                              minWidth: 0,
                              flex: 1,
                            }}
                          >
                            <div
                              style={{
                                display:
                                  "flex",
                                alignItems:
                                  "center",
                                gap: "6px",
                                flexWrap:
                                  "wrap",
                              }}
                            >
                              <strong
                                style={{
                                  fontSize:
                                    "14px",
                                  color:
                                    "#172536",
                                }}
                              >
                                {test.name}
                              </strong>

                              {test.short_name && (
                                <Badge>
                                  {
                                    test.short_name
                                  }
                                </Badge>
                              )}

                              <span
                                style={{
                                  fontSize:
                                    "10px",
                                  fontWeight:
                                    "800",
                                  color:
                                    test.active
                                      ? "#087f68"
                                      : "#a04444",
                                }}
                              >
                                {test.active
                                  ? "ACTIVE"
                                  : "INACTIVE"}
                              </span>
                            </div>

                            <div
                              style={{
                                marginTop:
                                  "6px",
                                display:
                                  "flex",
                                gap: "6px",
                                flexWrap:
                                  "wrap",
                              }}
                            >
                              <Badge>
                                {
                                  test.category
                                }
                              </Badge>

                              <Badge>
                                ₹
                                {currentPrice}
                              </Badge>

                              <Badge>
                                {test.sample_type ||
                                  "Sample not set"}
                              </Badge>
                            </div>
                          </div>

                          {/* ACTIONS */}

                          <div
                            style={{
                              display:
                                "flex",
                              gap: "5px",
                              alignItems:
                                "center",
                              flexWrap:
                                "wrap",
                              justifyContent:
                                "flex-end",
                            }}
                          >
                            <button
                              onClick={(
                                e
                              ) => {
                                e.stopPropagation();

                                openPriceEditor(
                                  test
                                );
                              }}
                              style={{
                                ...smallButton,
                                color:
                                  "#9a6b00",
                              }}
                            >
                              💰 Edit Price
                            </button>

                            <button
                              onClick={(
                                e
                              ) => {
                                e.stopPropagation();

                                editTest(
                                  test
                                );
                              }}
                              style={
                                smallButton
                              }
                            >
                              Edit
                            </button>

                            <button
                              onClick={(
                                e
                              ) => {
                                e.stopPropagation();

                                toggleActive(
                                  test
                                );
                              }}
                              style={
                                smallButton
                              }
                            >
                              {test.active
                                ? "Disable"
                                : "Enable"}
                            </button>

                            <button
                              onClick={(
                                e
                              ) => {
                                e.stopPropagation();

                                deleteTest(
                                  test
                                );
                              }}
                              style={{
                                ...smallButton,
                                color:
                                  "#b42323",
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </section>

          {/* =================================================
              RIGHT PANEL
          ================================================= */}

          <section
            style={{
              ...cardStyle,
              alignSelf:
                "start",
            }}
          >
            {!selectedTest ? (
              <div style={emptyStyle}>
                <div
                  style={{
                    fontSize: "40px",
                  }}
                >
                  🧪
                </div>

                <h3
                  style={{
                    color:
                      "#334155",
                  }}
                >
                  Select a Test
                </h3>

                <p>
                  Parameters manage करने
                  के लिए left side से test
                  select करें।
                </p>

                <button
                  onClick={
                    openNewTest
                  }
                  style={buttonStyle(
                    "#0e9f99",
                    "#ffffff"
                  )}
                >
                  + New Test
                </button>
              </div>
            ) : (
              <>
                {/* TEST DETAILS */}

                <div
                  style={{
                    padding: "15px",
                    borderBottom:
                      "1px solid #e8edf2",
                  }}
                >
                  <div
                    style={{
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      gap: "10px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize:
                            "10px",
                          fontWeight:
                            "900",
                          color:
                            "#079b94",
                        }}
                      >
                        SELECTED TEST
                      </div>

                      <h2
                        style={{
                          margin:
                            "4px 0",
                          fontSize:
                            "19px",
                        }}
                      >
                        {
                          selectedTest.name
                        }
                      </h2>

                      <p
                        style={{
                          margin: 0,
                          color:
                            "#687789",
                          fontSize:
                            "11px",
                        }}
                      >
                        {
                          selectedTest.category
                        }{" "}
                        • ₹
                        {getTestPrice(
                          selectedTest
                        )}
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        editTest(
                          selectedTest
                        )
                      }
                      style={
                        smallButton
                      }
                    >
                      ✏️ Edit Test
                    </button>
                  </div>
                </div>

                {/* PARAMETERS */}

                <div
                  style={{
                    padding: "15px",
                  }}
                >
                  <div
                    style={{
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      alignItems:
                        "center",
                      gap: "10px",
                      marginBottom:
                        "12px",
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          margin: 0,
                          fontSize:
                            "16px",
                        }}
                      >
                        Test Parameters
                      </h3>

                      <p
                        style={{
                          margin:
                            "4px 0 0",
                          color:
                            "#7b8795",
                          fontSize:
                            "11px",
                        }}
                      >
                        {parameters.length}{" "}
                        parameters
                      </p>
                    </div>

                    <button
                      onClick={
                        openNewParameter
                      }
                      style={buttonStyle(
                        "#0e9f99",
                        "#ffffff"
                      )}
                    >
                      + Add Parameter
                    </button>
                  </div>

                  {parameters.length ===
                  0 ? (
                    <div
                      style={{
                        padding:
                          "25px 10px",
                        textAlign:
                          "center",
                        border:
                          "1px dashed #cbd5df",
                        borderRadius:
                          "8px",
                      }}
                    >
                      <div
                        style={{
                          fontSize:
                            "28px",
                        }}
                      >
                        📋
                      </div>

                      <strong>
                        No parameters
                      </strong>

                      <p
                        style={{
                          fontSize:
                            "11px",
                          color:
                            "#7b8795",
                        }}
                      >
                        + Add Parameter पर
                        tap करें।
                      </p>
                    </div>
                  ) : (
                    <div
                      style={{
                        display:
                          "flex",
                        flexDirection:
                          "column",
                        gap: "8px",
                      }}
                    >
                      {parameters.map(
                        (
                          parameter
                        ) => (
                          <ParameterCard
                            key={
                              parameter.id
                            }
                            parameter={
                              parameter
                            }
                            onEdit={() =>
                              editParameter(
                                parameter
                              )
                            }
                            onDelete={() =>
                              deleteParameter(
                                parameter
                              )
                            }
                            onToggle={() =>
                              toggleParameterActive(
                                parameter
                              )
                            }
                          />
                        )
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </main>

      {/* =====================================================
          TEST MODAL
      ===================================================== */}

      {showTestForm && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <ModalHeader
              title={
                editingTestId
                  ? "Edit Test"
                  : "Add New Test"
              }
              subtitle="Test ki basic information"
              onClose={() =>
                setShowTestForm(
                  false
                )
              }
            />

            <form
              onSubmit={saveTest}
            >
              <div style={formGrid}>
                <Field
                  label="Test Name *"
                  value={
                    testForm.name
                  }
                  onChange={(value) =>
                    setTestForm({
                      ...testForm,
                      name: value,
                    })
                  }
                  placeholder="Complete Blood Count"
                />

                <Field
                  label="Short Name"
                  value={
                    testForm.short_name
                  }
                  onChange={(value) =>
                    setTestForm({
                      ...testForm,
                      short_name:
                        value,
                    })
                  }
                  placeholder="CBC"
                />

                <SelectField
                  label="Category"
                  value={
                    testForm.category
                  }
                  onChange={(value) =>
                    setTestForm({
                      ...testForm,
                      category:
                        value,
                    })
                  }
                  options={
                    CATEGORIES
                  }
                />

                <Field
                  label="Department"
                  value={
                    testForm.department
                  }
                  onChange={(value) =>
                    setTestForm({
                      ...testForm,
                      department:
                        value,
                    })
                  }
                  placeholder="Laboratory"
                />

                <Field
                  label="Sample Type"
                  value={
                    testForm.sample_type
                  }
                  onChange={(value) =>
                    setTestForm({
                      ...testForm,
                      sample_type:
                        value,
                    })
                  }
                  placeholder="EDTA Blood / Serum / Urine"
                />

                <Field
                  label="Price ₹"
                  type="number"
                  value={
                    testForm.price
                  }
                  onChange={(value) =>
                    setTestForm({
                      ...testForm,
                      price: value,
                    })
                  }
                  placeholder="250"
                />

                <Field
                  label="Method"
                  value={
                    testForm.method
                  }
                  onChange={(value) =>
                    setTestForm({
                      ...testForm,
                      method:
                        value,
                    })
                  }
                  placeholder="Automated / Manual"
                />
              </div>

              <Checkbox
                label="Active Test"
                checked={
                  testForm.active
                }
                onChange={(value) =>
                  setTestForm({
                    ...testForm,
                    active:
                      value,
                  })
                }
              />

              <ModalActions
                saving={saving}
                onCancel={() =>
                  setShowTestForm(
                    false
                  )
                }
                submitText={
                  editingTestId
                    ? "Update Test"
                    : "Save Test"
                }
              />
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          PRICE MODAL
      ===================================================== */}

      {showPriceForm &&
        priceTest && (
          <div
            style={overlayStyle}
          >
            <div
              style={modalStyle}
            >
              <ModalHeader
                title="Edit Test Price"
                subtitle={
                  priceTest.name
                }
                onClose={() =>
                  setShowPriceForm(
                    false
                  )
                }
              />

              <div
                style={{
                  padding:
                    "10px 12px",
                  background:
                    "#f0fdfa",
                  border:
                    "1px solid #ccfbf1",
                  borderRadius:
                    "8px",
                  marginBottom:
                    "15px",
                }}
              >
                <div
                  style={{
                    fontSize:
                      "11px",
                    color:
                      "#64748b",
                  }}
                >
                  Current Price
                </div>

                <strong
                  style={{
                    fontSize:
                      "20px",
                    color:
                      "#087f68",
                  }}
                >
                  ₹
                  {getTestPrice(
                    priceTest
                  )}
                </strong>
              </div>

              <form
                onSubmit={
                  savePrice
                }
              >
                <Field
                  label="New Test Price ₹ *"
                  type="number"
                  value={
                    priceValue
                  }
                  onChange={
                    setPriceValue
                  }
                  placeholder="250"
                />

                <ModalActions
                  saving={saving}
                  onCancel={() =>
                    setShowPriceForm(
                      false
                    )
                  }
                  submitText="Save Price"
                />
              </form>
            </div>
          </div>
        )}

      {/* =====================================================
          PARAMETER MODAL
      ===================================================== */}

      {showParameterForm && (
        <div
          style={overlayStyle}
        >
          <div
            style={modalStyle}
          >
            <ModalHeader
              title={
                editingParameterId
                  ? "Edit Parameter"
                  : "Add Parameter"
              }
              subtitle={
                selectedTest?.name ||
                ""
              }
              onClose={() =>
                setShowParameterForm(
                  false
                )
              }
            />

            <form
              onSubmit={
                saveParameter
              }
            >
              <Field
                label="Parameter Name *"
                value={
                  parameterForm.parameter_name
                }
                onChange={(value) =>
                  setParameterForm({
                    ...parameterForm,
                    parameter_name:
                      value,
                  })
                }
                placeholder="Haemoglobin"
              />

              <div
                style={formGrid}
              >
                <Field
                  label="Unit"
                  value={
                    parameterForm.unit
                  }
                  onChange={(value) =>
                    setParameterForm({
                      ...parameterForm,
                      unit: value,
                    })
                  }
                  placeholder="g/dL"
                />

                <Field
                  label="Minimum Normal Value"
                  type="number"
                  value={
                    parameterForm.min_value
                  }
                  onChange={(value) =>
                    setParameterForm({
                      ...parameterForm,
                      min_value:
                        value,
                    })
                  }
                  placeholder="13"
                />

                <Field
                  label="Maximum Normal Value"
                  type="number"
                  value={
                    parameterForm.max_value
                  }
                  onChange={(value) =>
                    setParameterForm({
                      ...parameterForm,
                      max_value:
                        value,
                    })
                  }
                  placeholder="17"
                />

                <Field
                  label="Sort Order"
                  type="number"
                  value={
                    parameterForm.sort_order
                  }
                  onChange={(value) =>
                    setParameterForm({
                      ...parameterForm,
                      sort_order:
                        value,
                    })
                  }
                  placeholder="1"
                />
              </div>

              {/* =================================================
                  NORMAL / REFERENCE RANGE
              ================================================= */}

              <div
                style={{
                  marginTop: "13px",
                  padding:
                    "12px",
                  border:
                    "1px solid #cce9e6",
                  background:
                    "#f3fffd",
                  borderRadius:
                    "8px",
                }}
              >
                <label
                  style={
                    labelStyle
                  }
                >
                  Normal Value /
                  Reference Range *
                </label>

                <textarea
                  value={
                    parameterForm.reference_range
                  }
                  onChange={(e) =>
                    setParameterForm({
                      ...parameterForm,
                      reference_range:
                        e.target.value,
                    })
                  }
                  placeholder="Male: 13-17 g/dL | Female: 12-15 g/dL"
                  style={{
                    ...inputStyle,
                    minHeight:
                      "75px",
                    resize:
                      "vertical",
                  }}
                />

                <div
                  style={{
                    marginTop:
                      "6px",
                    fontSize:
                      "10px",
                    color:
                      "#64748b",
                    lineHeight:
                      "1.5",
                  }}
                >
                  Example:
                  <br />
                  Male: 13-17 g/dL
                  <br />
                  Female: 12-15 g/dL
                  <br />
                  Child: Age specific
                </div>
              </div>

              {/* OPTIONS */}

              <div
                style={{
                  marginTop:
                    "13px",
                }}
              >
                <label
                  style={
                    labelStyle
                  }
                >
                  Options / Text
                </label>

                <textarea
                  value={
                    parameterForm.options
                  }
                  onChange={(e) =>
                    setParameterForm({
                      ...parameterForm,
                      options:
                        e.target.value,
                    })
                  }
                  placeholder='Example: {"choices":["Positive","Negative"]}'
                  style={{
                    ...inputStyle,
                    minHeight:
                      "75px",
                    resize:
                      "vertical",
                    fontFamily:
                      "monospace",
                  }}
                />

                <div
                  style={{
                    marginTop:
                      "5px",
                    fontSize:
                      "10px",
                    color:
                      "#64748b",
                  }}
                >
                  Positive / Negative,
                  Blood Group आदि के लिए
                  options use कर सकते हैं।
                </div>
              </div>

              <Checkbox
                label="Active Parameter"
                checked={
                  parameterForm.active
                }
                onChange={(value) =>
                  setParameterForm({
                    ...parameterForm,
                    active:
                      value,
                  })
                }
              />

              <ModalActions
                saving={saving}
                onCancel={() =>
                  setShowParameterForm(
                    false
                  )
                }
                submitText={
                  editingParameterId
                    ? "Update Parameter"
                    : "Save Parameter"
                }
              />
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   PARAMETER CARD
========================================================= */

function ParameterCard({
  parameter,
  onEdit,
  onDelete,
  onToggle,
}) {
  return (
    <div
      style={{
        border:
          "1px solid #e1e7ed",
        borderRadius:
          "9px",
        padding: "11px",
        background:
          parameter.active
            ? "#ffffff"
            : "#f8fafc",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          gap: "10px",
        }}
      >
        <div
          style={{
            minWidth: 0,
            flex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems:
                "center",
              gap: "6px",
              flexWrap:
                "wrap",
            }}
          >
            <strong
              style={{
                fontSize:
                  "13px",
              }}
            >
              {
                parameter.parameter_name
              }
            </strong>

            <span
              style={{
                fontSize:
                  "9px",
                fontWeight:
                  "800",
                color:
                  parameter.active
                    ? "#087f68"
                    : "#a04444",
              }}
            >
              {parameter.active
                ? "ACTIVE"
                : "INACTIVE"}
            </span>
          </div>

          {/* UNIT */}

          <div
            style={{
              fontSize:
                "10px",
              color:
                "#64748b",
              marginTop:
                "5px",
            }}
          >
            <strong>
              Unit:
            </strong>{" "}
            {parameter.unit ||
              "—"}
          </div>

          {/* MIN MAX */}

          <div
            style={{
              fontSize:
                "10px",
              color:
                "#64748b",
              marginTop:
                "3px",
            }}
          >
            <strong>
              Normal Min:
            </strong>{" "}
            {parameter.min_value ??
              "—"}{" "}
            •{" "}
            <strong>
              Max:
            </strong>{" "}
            {parameter.max_value ??
              "—"}
          </div>

          {/* REFERENCE RANGE */}

          <div
            style={{
              marginTop:
                "7px",
              padding:
                "7px 8px",
              background:
                "#f0fdfa",
              border:
                "1px solid #ccfbf1",
              borderRadius:
                "6px",
              fontSize:
                "10px",
              color:
                "#334155",
              lineHeight:
                "1.5",
            }}
          >
            <strong
              style={{
                color:
                  "#087f68",
              }}
            >
              Normal /
              Reference:
            </strong>

            <div
              style={{
                marginTop:
                  "2px",
                whiteSpace:
                  "pre-wrap",
                wordBreak:
                  "break-word",
              }}
            >
              {parameter.reference_range ||
                "Not set"}
            </div>
          </div>
        </div>

        {/* ACTIONS */}

        <div
          style={{
            display:
              "flex",
            flexDirection:
              "column",
            gap: "5px",
          }}
        >
          <button
            onClick={onEdit}
            style={
              smallButton
            }
          >
            ✏️ Edit
          </button>

          <button
            onClick={onToggle}
            style={
              smallButton
            }
          >
            {parameter.active
              ? "Disable"
              : "Enable"}
          </button>

          <button
            onClick={onDelete}
            style={{
              ...smallButton,
              color:
                "#b42323",
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   FIELD
========================================================= */

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}) {
  return (
    <div>
      <label
        style={
          labelStyle
        }
      >
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        placeholder={
          placeholder
        }
        style={
          inputStyle
        }
      />
    </div>
  );
}

/* =========================================================
   SELECT FIELD
========================================================= */

function SelectField({
  label,
  value,
  onChange,
  options,
}) {
  return (
    <div>
      <label
        style={
          labelStyle
        }
      >
        {label}
      </label>

      <select
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        style={
          inputStyle
        }
      >
        {options.map(
          (item) => (
            <option
              key={item}
              value={item}
            >
              {item}
            </option>
          )
        )}
      </select>
    </div>
  );
}

/* =========================================================
   CHECKBOX
========================================================= */

function Checkbox({
  label,
  checked,
  onChange,
}) {
  return (
    <label
      style={{
        display:
          "flex",
        gap: "8px",
        alignItems:
          "center",
        marginTop:
          "14px",
        fontSize:
          "12px",
        fontWeight:
          "800",
      }}
    >
      <input
        type="checkbox"
        checked={
          checked
        }
        onChange={(e) =>
          onChange(
            e.target.checked
          )
        }
      />

      {label}
    </label>
  );
}

/* =========================================================
   BADGE
========================================================= */

function Badge({
  children,
}) {
  return (
    <span
      style={{
        background:
          "#eef5f7",
        color:
          "#536674",
        borderRadius:
          "15px",
        padding:
          "3px 7px",
        fontSize:
          "9px",
        fontWeight:
          "700",
        whiteSpace:
          "nowrap",
      }}
    >
      {children}
    </span>
  );
}

/* =========================================================
   MODAL HEADER
========================================================= */

function ModalHeader({
  title,
  subtitle,
  onClose,
}) {
  return (
    <div
      style={
        modalHeader
      }
    >
      <div>
        <h2
          style={{
            margin: 0,
            fontSize:
              "20px",
            color:
              "#172536",
          }}
        >
          {title}
        </h2>

        <p
          style={{
            margin:
              "4px 0 0",
            color:
              "#718096",
            fontSize:
              "11px",
          }}
        >
          {subtitle}
        </p>
      </div>

      <button
        type="button"
        onClick={
          onClose
        }
        style={
          closeButton
        }
      >
        ×
      </button>
    </div>
  );
}

/* =========================================================
   MODAL ACTIONS
========================================================= */

function ModalActions({
  saving,
  onCancel,
  submitText,
}) {
  return (
    <div
      style={{
        display:
          "flex",
        justifyContent:
          "flex-end",
        gap: "8px",
        marginTop:
          "20px",
      }}
    >
      <button
        type="button"
        onClick={
          onCancel
        }
        style={buttonStyle(
          "#ffffff",
          "#475569"
        )}
      >
        Cancel
      </button>

      <button
        type="submit"
        disabled={saving}
        style={buttonStyle(
          "#0e9f99",
          "#ffffff"
        )}
      >
        {saving
          ? "Saving..."
          : submitText}
      </button>
    </div>
  );
}

/* =========================================================
   STYLES
========================================================= */

const pageStyle = {
  minHeight:
    "100vh",
  background:
    "#f4f7fa",
  fontFamily:
    "Arial, Helvetica, sans-serif",
};

const headerStyle = {
  background:
    "#ffffff",
  borderBottom:
    "1px solid #e2e8ef",
  padding:
    "12px 16px",
  display:
    "flex",
  alignItems:
    "center",
  justifyContent:
    "space-between",
  gap: "12px",
  position:
    "sticky",
  top: 0,
  zIndex: 20,
};

const mainStyle = {
  padding:
    "14px",
  maxWidth:
    "1500px",
  margin:
    "auto",
};

const searchCardStyle = {
  background:
    "#ffffff",
  border:
    "1px solid #e2e8ef",
  borderRadius:
    "10px",
  padding:
    "12px",
  marginBottom:
    "14px",
};

const contentGridStyle = {
  display:
    "grid",
  gridTemplateColumns:
    "minmax(0, 1.25fr) minmax(350px, 0.75fr)",
  gap: "14px",
};

const cardStyle = {
  background:
    "#ffffff",
  border:
    "1px solid #e2e8ef",
  borderRadius:
    "10px",
  overflow:
    "hidden",
};

const inputStyle = {
  width:
    "100%",
  boxSizing:
    "border-box",
  padding:
    "10px 11px",
  border:
    "1px solid #d7e0e8",
  borderRadius:
    "7px",
  outline:
    "none",
  fontSize:
    "12px",
  background:
    "#ffffff",
};

const labelStyle = {
  display:
    "block",
  marginBottom:
    "5px",
  fontSize:
    "11px",
  fontWeight:
    "800",
  color:
    "#344054",
};

const formGrid = {
  display:
    "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",
  gap: "11px",
};

const buttonStyle = (
  background,
  color
) => ({
  border:
    "1px solid #d6dee6",
  background,
  color,
  padding:
    "8px 11px",
  borderRadius:
    "7px",
  cursor:
    "pointer",
  fontWeight:
    "800",
  fontSize:
    "11px",
});

const smallButton = {
  border:
    "1px solid #d6dee6",
  background:
    "#ffffff",
  color:
    "#176b67",
  padding:
    "5px 7px",
  borderRadius:
    "5px",
  cursor:
    "pointer",
  fontWeight:
    "700",
  fontSize:
    "9px",
  whiteSpace:
    "nowrap",
};

const emptyStyle = {
  padding:
    "45px 20px",
  textAlign:
    "center",
  color:
    "#718096",
};

const overlayStyle = {
  position:
    "fixed",
  inset: 0,
  background:
    "rgba(15, 23, 42, 0.55)",
  display:
    "flex",
  justifyContent:
    "center",
  alignItems:
    "center",
  padding:
    "15px",
  zIndex:
    100,
};

const modalStyle = {
  background:
    "#ffffff",
  width:
    "100%",
  maxWidth:
    "650px",
  maxHeight:
    "92vh",
  overflowY:
    "auto",
  borderRadius:
    "12px",
  padding:
    "18px",
  boxShadow:
    "0 20px 60px rgba(0,0,0,0.25)",
};

const modalHeader = {
  display:
    "flex",
  justifyContent:
    "space-between",
  gap: "15px",
  alignItems:
    "flex-start",
  marginBottom:
    "17px",
};

const closeButton = {
  border:
    "none",
  background:
    "#f1f5f9",
  width:
    "32px",
  height:
    "32px",
  borderRadius:
    "50%",
  cursor:
    "pointer",
  fontSize:
    "22px",
  lineHeight:
    "30px",
};
