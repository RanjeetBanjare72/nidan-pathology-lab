"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const CATEGORIES = [
  "All",
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

export default function TestMasterPage() {
  const router = useRouter();

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [showNewTest, setShowNewTest] = useState(false);
  const [newTest, setNewTest] = useState(EMPTY_TEST);

  const [saving, setSaving] = useState(false);

  const [priceModal, setPriceModal] = useState(false);
  const [selectedPriceTest, setSelectedPriceTest] =
    useState(null);
  const [newPrice, setNewPrice] = useState("");

  const [message, setMessage] = useState("");

  // =========================================================
  // LOAD ALL TESTS
  // =========================================================

  async function loadAllTests() {
    try {
      setLoading(true);
      setMessage("");

      // -----------------------------------------------------
      // 1. Load tests table
      // -----------------------------------------------------

      const {
        data: masterTests,
        error: masterError,
      } = await supabase
        .from("tests")
        .select("*")
        .order("name", { ascending: true });

      if (masterError) {
        console.warn(
          "tests table loading error:",
          masterError.message
        );
      }

      // -----------------------------------------------------
      // 2. Load test_prices table
      // -----------------------------------------------------

      const {
        data: priceRows,
        error: priceError,
      } = await supabase
        .from("test_prices")
        .select("*")
        .order("test_name", {
          ascending: true,
        });

      if (priceError) {
        console.warn(
          "test_prices loading error:",
          priceError.message
        );
      }

      // -----------------------------------------------------
      // 3. Load reports
      // Existing investigations are stored here
      // -----------------------------------------------------

      const {
        data: reports,
        error: reportError,
      } = await supabase
        .from("reports")
        .select("id, tests");

      if (reportError) {
        throw reportError;
      }

      // -----------------------------------------------------
      // PRICE MAP
      // -----------------------------------------------------

      const priceMap = {};

      (priceRows || []).forEach((row) => {
        const key = String(
          row.test_id ||
            row.test_name ||
            ""
        )
          .trim()
          .toLowerCase();

        if (!key) return;

        priceMap[key] = {
          price:
            row.price === null ||
            row.price === undefined
              ? 0
              : Number(row.price),
          rowId: row.id,
          category:
            row.category || "Other",
          active:
            row.is_active === undefined
              ? true
              : row.is_active,
        };
      });

      // -----------------------------------------------------
      // MASTER TEST MAP
      // -----------------------------------------------------

      const testMap = new Map();

      // -----------------------------------------------------
      // A. Add tests table records
      // -----------------------------------------------------

      (masterTests || []).forEach((test) => {
        const id = String(
          test.id || test.name
        );

        const key = String(
          test.id ||
            test.short_name ||
            test.name ||
            ""
        )
          .trim()
          .toLowerCase();

        const priceInfo =
          priceMap[key];

        testMap.set(key, {
          id,
          source: "tests",

          name:
            test.name ||
            test.short_name ||
            id,

          short_name:
            test.short_name ||
            "",

          category:
            test.category ||
            priceInfo?.category ||
            "Other",

          department:
            test.department ||
            "Laboratory",

          sample_type:
            test.sample_type ||
            "",

          method:
            test.method ||
            "",

          price:
            priceInfo
              ? priceInfo.price
              : Number(test.price || 0),

          active:
            priceInfo
              ? priceInfo.active
              : test.active !== false,

          priceRowId:
            priceInfo?.rowId || null,
        });
      });

      // -----------------------------------------------------
      // B. Extract existing tests from reports.tests JSONB
      // -----------------------------------------------------

      (reports || []).forEach((report) => {
        let reportTests = report.tests;

        if (!reportTests) return;

        // Sometimes JSONB can arrive as string
        if (typeof reportTests === "string") {
          try {
            reportTests =
              JSON.parse(reportTests);
          } catch {
            return;
          }
        }

        if (!Array.isArray(reportTests)) {
          return;
        }

        reportTests.forEach((item) => {
          if (!item) return;

          const testId = String(
            item.id ||
              item.test_id ||
              item.code ||
              item.short_name ||
              item.name ||
              ""
          )
            .trim()
            .toLowerCase();

          if (!testId) return;

          const name =
            item.name ||
            item.test_name ||
            item.parameter_name ||
            testId;

          const existing =
            testMap.get(testId);

          const priceInfo =
            priceMap[testId];

          const reportPrice =
            item.price !== undefined &&
            item.price !== null
              ? Number(item.price)
              : 0;

          // If test already exists in tests table
          if (existing) {
            // Use centralized test_prices first.
            // Otherwise keep master price.
            if (priceInfo) {
              existing.price =
                priceInfo.price;
              existing.priceRowId =
                priceInfo.rowId;
            }

            return;
          }

          // Add legacy/existing report test
          testMap.set(testId, {
            id: testId,
            source: "reports",

            name,

            short_name:
              item.short ||
              item.short_name ||
              "",

            category:
              item.category ||
              "Other",

            department:
              item.department ||
              "Laboratory",

            sample_type:
              item.sample_type ||
              item.sample ||
              "",

            method:
              item.method ||
              "",

            price: priceInfo
              ? priceInfo.price
              : reportPrice,

            active: priceInfo
              ? priceInfo.active
              : true,

            priceRowId:
              priceInfo?.rowId || null,
          });
        });
      });

      const finalTests = Array.from(
        testMap.values()
      ).sort((a, b) =>
        String(a.name).localeCompare(
          String(b.name)
        )
      );

      setTests(finalTests);
    } catch (error) {
      console.error(
        "LOAD TESTS ERROR:",
        error
      );

      alert(
        "Investigation tests load nahi hue:\n" +
          error.message
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadAllTests();
  }, []);

  // =========================================================
  // OPEN PRICE EDIT
  // =========================================================

  function openPriceEdit(test) {
    setSelectedPriceTest(test);
    setNewPrice(
      test.price === null ||
        test.price === undefined
        ? ""
        : String(test.price)
    );
    setPriceModal(true);
  }

  // =========================================================
  // SAVE PRICE
  // =========================================================

  async function savePrice() {
    if (!selectedPriceTest) {
      return;
    }

    const numericPrice =
      Number(newPrice);

    if (
      newPrice === "" ||
      Number.isNaN(numericPrice) ||
      numericPrice < 0
    ) {
      alert(
        "Please valid price enter karein."
      );
      return;
    }

    try {
      setSaving(true);

      const test = selectedPriceTest;

      const testId = String(
        test.id || test.name
      );

      // -----------------------------------------------------
      // Check whether price row already exists
      // -----------------------------------------------------

      const {
        data: existingRows,
        error: findError,
      } = await supabase
        .from("test_prices")
        .select("*")
        .eq("test_id", testId)
        .limit(1);

      if (findError) {
        throw findError;
      }

      if (
        existingRows &&
        existingRows.length > 0
      ) {
        // ---------------------------------------------------
        // UPDATE EXISTING PRICE
        // ---------------------------------------------------

        const row =
          existingRows[0];

        const { error } =
          await supabase
            .from("test_prices")
            .update({
              test_name: test.name,
              category:
                test.category ||
                "Other",
              price: numericPrice,
              is_active:
                test.active !== false,
              updated_at:
                new Date().toISOString(),
            })
            .eq("id", row.id);

        if (error) {
          throw error;
        }
      } else {
        // ---------------------------------------------------
        // INSERT NEW PRICE
        // ---------------------------------------------------

        const { error } =
          await supabase
            .from("test_prices")
            .insert([
              {
                test_id: testId,
                test_name: test.name,
                category:
                  test.category ||
                  "Other",
                price: numericPrice,
                is_active:
                  test.active !== false,
                created_at:
                  new Date().toISOString(),
                updated_at:
                  new Date().toISOString(),
              },
            ]);

        if (error) {
          throw error;
        }
      }

      // -----------------------------------------------------
      // If actual tests table record exists,
      // also update its price.
      // -----------------------------------------------------

      if (
        test.source === "tests"
      ) {
        const { error } =
          await supabase
            .from("tests")
            .update({
              price: numericPrice,
              updated_at:
                new Date().toISOString(),
            })
            .eq("id", test.id);

        if (error) {
          console.warn(
            "tests price update warning:",
            error.message
          );
        }
      }

      setPriceModal(false);
      setSelectedPriceTest(null);

      await loadAllTests();

      setMessage(
        `${test.name} ka price ₹${numericPrice} successfully update ho gaya.`
      );

      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (error) {
      console.error(
        "PRICE SAVE ERROR:",
        error
      );

      alert(
        "Price save nahi hua:\n" +
          error.message
      );
    } finally {
      setSaving(false);
    }
  }

  // =========================================================
  // ADD NEW TEST
  // =========================================================

  function openNewTest() {
    setNewTest({
      ...EMPTY_TEST,
    });

    setShowNewTest(true);
  }

  // =========================================================
  // SAVE NEW TEST
  // =========================================================

  async function saveNewTest(e) {
    e.preventDefault();

    if (!newTest.name.trim()) {
      alert(
        "Test name zaroori hai."
      );
      return;
    }

    try {
      setSaving(true);

      const price =
        newTest.price === ""
          ? 0
          : Number(newTest.price);

      // -----------------------------------------------------
      // Create tests table record
      // -----------------------------------------------------

      const { data, error } =
        await supabase
          .from("tests")
          .insert([
            {
              name:
                newTest.name.trim(),

              short_name:
                newTest.short_name.trim(),

              category:
                newTest.category,

              department:
                newTest.department.trim(),

              sample_type:
                newTest.sample_type.trim(),

              price,

              method:
                newTest.method.trim(),

              active:
                newTest.active,

              updated_at:
                new Date().toISOString(),
            },
          ])
          .select()
          .single();

      if (error) {
        throw error;
      }

      // -----------------------------------------------------
      // Also create centralized price
      // -----------------------------------------------------

      if (data?.id) {
        const { error: priceError } =
          await supabase
            .from("test_prices")
            .insert([
              {
                test_id:
                  String(data.id),

                test_name:
                  data.name,

                category:
                  data.category ||
                  "Other",

                price,

                is_active:
                  data.active !== false,

                created_at:
                  new Date().toISOString(),

                updated_at:
                  new Date().toISOString(),
              },
            ]);

        if (priceError) {
          console.warn(
            "New test price insert warning:",
            priceError.message
          );
        }
      }

      setShowNewTest(false);

      await loadAllTests();

      setMessage(
        "New test successfully add ho gaya."
      );

      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (error) {
      console.error(
        "NEW TEST ERROR:",
        error
      );

      alert(
        "New test save nahi hua:\n" +
          error.message
      );
    } finally {
      setSaving(false);
    }
  }

  // =========================================================
  // FILTER
  // =========================================================

  const filteredTests = useMemo(() => {
    const text =
      search
        .trim()
        .toLowerCase();

    return tests.filter(
      (test) => {
        const matchesSearch =
          !text ||
          String(
            test.name || ""
          )
            .toLowerCase()
            .includes(text) ||
          String(
            test.short_name || ""
          )
            .toLowerCase()
            .includes(text) ||
          String(
            test.category || ""
          )
            .toLowerCase()
            .includes(text);

        const matchesCategory =
          category === "All" ||
          test.category ===
            category;

        return (
          matchesSearch &&
          matchesCategory
        );
      }
    );
  }, [
    tests,
    search,
    category,
  ]);

  // =========================================================
  // UI
  // =========================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "#f4f7fa",
        fontFamily:
          "Arial, Helvetica, sans-serif",
        color: "#172536",
      }}
    >
      {/* ===================================================
          HEADER
      =================================================== */}

      <header
        style={{
          background:
            "#ffffff",
          borderBottom:
            "1px solid #dfe7ed",
          padding:
            "14px 18px",
          display: "flex",
          justifyContent:
            "space-between",
          alignItems:
            "center",
          gap: "10px",
          position:
            "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <div>
          <div
            style={{
              color:
                "#079b94",
              fontSize:
                "11px",
              fontWeight:
                "900",
              letterSpacing:
                "1px",
            }}
          >
            NIDAN PATHOLOGY LAB
          </div>

          <h1
            style={{
              margin:
                "3px 0",
              fontSize:
                "22px",
            }}
          >
            Test Master
          </h1>

          <div
            style={{
              fontSize:
                "12px",
              color:
                "#718096",
            }}
          >
            Tests, prices,
            parameters &
            reference ranges
            manage karein
          </div>
        </div>

        <div
          style={{
            display:
              "flex",
            gap: "7px",
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
      </header>

      {/* ===================================================
          MESSAGE
      =================================================== */}

      {message && (
        <div
          style={{
            margin:
              "12px auto 0",
            maxWidth:
              "1200px",
            padding:
              "11px 14px",
            background:
              "#e8f8f5",
            border:
              "1px solid #a8ded6",
            color:
              "#08756e",
            borderRadius:
              "8px",
            fontSize:
              "13px",
            fontWeight:
              "700",
          }}
        >
          ✓ {message}
        </div>
      )}

      {/* ===================================================
          MAIN
      =================================================== */}

      <main
        style={{
          maxWidth:
            "1250px",
          margin:
            "0 auto",
          padding:
            "18px",
        }}
      >
        {/* SEARCH */}

        <section
          style={{
            background:
              "#ffffff",
            border:
              "1px solid #e0e7ee",
            borderRadius:
              "11px",
            padding:
              "14px",
            marginBottom:
              "16px",
          }}
        >
          <div
            style={{
              display:
                "grid",
              gridTemplateColumns:
                "1fr 220px",
              gap:
                "10px",
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
              style={
                inputStyle
              }
            />

            <select
              value={category}
              onChange={(e) =>
                setCategory(
                  e.target.value
                )
              }
              style={
                inputStyle
              }
            >
              {CATEGORIES.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item ===
                    "All"
                      ? "All Categories"
                      : item}
                  </option>
                )
              )}
            </select>
          </div>
        </section>

        {/* =================================================
            TEST LIST
        ================================================= */}

        <section
          style={{
            background:
              "#ffffff",
            border:
              "1px solid #e0e7ee",
            borderRadius:
              "11px",
            overflow:
              "hidden",
          }}
        >
          <div
            style={{
              padding:
                "15px",
              borderBottom:
                "1px solid #e8edf2",
              display:
                "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
            }}
          >
            <div>
              <h2
                style={{
                  margin:
                    0,
                  fontSize:
                    "18px",
                }}
              >
                Laboratory Tests
              </h2>

              <div
                style={{
                  marginTop:
                    "4px",
                  color:
                    "#7b8795",
                  fontSize:
                    "12px",
                }}
              >
                {filteredTests.length}{" "}
                investigations
              </div>
            </div>

            <button
              onClick={
                loadAllTests
              }
              style={smallButton}
            >
              ↻ Refresh
            </button>
          </div>

          {loading ? (
            <div
              style={
                emptyStyle
              }
            >
              <div
                style={{
                  fontSize:
                    "30px",
                }}
              >
                🧪
              </div>

              Loading
              investigations...
            </div>
          ) : filteredTests.length ===
            0 ? (
            <div
              style={
                emptyStyle
              }
            >
              <div
                style={{
                  fontSize:
                    "38px",
                }}
              >
                🧪
              </div>

              <h3
                style={{
                  margin:
                    "8px 0 5px",
                }}
              >
                No tests found
              </h3>

              <p
                style={{
                  margin:
                    0,
                  fontSize:
                    "12px",
                }}
              >
                Search clear karein
                ya + New Test se
                test add karein.
              </p>
            </div>
          ) : (
            <div>
              {filteredTests.map(
                (test) => (
                  <div
                    key={
                      `${test.source}-${test.id}`
                    }
                    style={{
                      padding:
                        "14px",
                      borderBottom:
                        "1px solid #edf1f5",
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
                        gap:
                          "12px",
                      }}
                    >
                      {/* TEST INFO */}

                      <div
                        style={{
                          minWidth:
                            0,
                          flex: 1,
                        }}
                      >
                        <div
                          style={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            gap:
                              "8px",
                            flexWrap:
                              "wrap",
                          }}
                        >
                          <strong
                            style={{
                              fontSize:
                                "15px",
                            }}
                          >
                            {test.name}
                          </strong>

                          {test.short_name && (
                            <span
                              style={{
                                fontSize:
                                  "10px",
                                background:
                                  "#eef5f7",
                                color:
                                  "#526775",
                                padding:
                                  "3px 7px",
                                borderRadius:
                                  "10px",
                                fontWeight:
                                  "700",
                              }}
                            >
                              {
                                test.short_name
                              }
                            </span>
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
                            display:
                              "flex",
                            gap:
                              "6px",
                            flexWrap:
                              "wrap",
                            marginTop:
                              "7px",
                          }}
                        >
                          <Badge>
                            {test.category ||
                              "Other"}
                          </Badge>

                          <Badge>
                            ₹
                            {Number(
                              test.price ||
                                0
                            )}
                          </Badge>

                          {test.sample_type && (
                            <Badge>
                              {
                                test.sample_type
                              }
                            </Badge>
                          )}

                          {test.source ===
                            "reports" && (
                            <Badge>
                              Existing
                              Report
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* ACTIONS */}

                      <div
                        style={{
                          display:
                            "flex",
                          gap:
                            "6px",
                          alignItems:
                            "center",
                          flexWrap:
                            "wrap",
                          justifyContent:
                            "flex-end",
                        }}
                      >
                        <button
                          onClick={() =>
                            openPriceEdit(
                              test
                            )
                          }
                          style={{
                            ...priceButton,
                          }}
                        >
                          💰 Edit Price
                        </button>

                        {test.source ===
                          "tests" && (
                          <button
                            onClick={() =>
                              alert(
                                "Test record already exists in Test Master. Price Edit ke liye 💰 Edit Price use karein."
                              )
                            }
                            style={
                              smallButton
                            }
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>
      </main>

      {/* ===================================================
          PRICE MODAL
      =================================================== */}

      {priceModal &&
        selectedPriceTest && (
          <div
            style={
              overlayStyle
            }
          >
            <div
              style={
                modalStyle
              }
            >
              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "flex-start",
                  gap:
                    "15px",
                  marginBottom:
                    "18px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize:
                        "11px",
                      color:
                        "#079b94",
                      fontWeight:
                        "900",
                      letterSpacing:
                        "1px",
                    }}
                  >
                    EDIT TEST PRICE
                  </div>

                  <h2
                    style={{
                      margin:
                        "5px 0",
                      fontSize:
                        "20px",
                    }}
                  >
                    {
                      selectedPriceTest.name
                    }
                  </h2>

                  <div
                    style={{
                      color:
                        "#718096",
                      fontSize:
                        "12px",
                    }}
                  >
                    Current Price: ₹
                    {Number(
                      selectedPriceTest.price ||
                        0
                    )}
                  </div>
                </div>

                <button
                  onClick={() =>
                    setPriceModal(
                      false
                    )
                  }
                  style={
                    closeButton
                  }
                >
                  ×
                </button>
              </div>

              <label
                style={
                  labelStyle
                }
              >
                New Test Price ₹
              </label>

              <input
                autoFocus
                type="number"
                min="0"
                step="0.01"
                value={newPrice}
                onChange={(e) =>
                  setNewPrice(
                    e.target.value
                  )
                }
                placeholder="Enter new price"
                style={{
                  ...inputStyle,
                  fontSize:
                    "18px",
                  fontWeight:
                    "700",
                }}
              />

              <div
                style={{
                  marginTop:
                    "18px",
                  padding:
                    "11px",
                  background:
                    "#f0faf8",
                  border:
                    "1px solid #c7e8e3",
                  borderRadius:
                    "7px",
                  fontSize:
                    "12px",
                  color:
                    "#286d68",
                }}
              >
                Old Price: ₹
                {Number(
                  selectedPriceTest.price ||
                    0
                )}
                <br />
                New Price: ₹
                {newPrice || 0}
              </div>

              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "flex-end",
                  gap:
                    "8px",
                  marginTop:
                    "20px",
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    setPriceModal(
                      false
                    )
                  }
                  style={buttonStyle(
                    "#ffffff",
                    "#475569"
                  )}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={
                    savePrice
                  }
                  disabled={
                    saving
                  }
                  style={buttonStyle(
                    "#0e9f99",
                    "#ffffff"
                  )}
                >
                  {saving
                    ? "Saving..."
                    : "✓ Save Price"}
                </button>
              </div>
            </div>
          </div>
        )}

      {/* ===================================================
          NEW TEST MODAL
      =================================================== */}

      {showNewTest && (
        <div
          style={
            overlayStyle
          }
        >
          <div
            style={{
              ...modalStyle,
              maxWidth:
                "650px",
            }}
          >
            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "space-between",
                marginBottom:
                  "18px",
              }}
            >
              <div>
                <h2
                  style={{
                    margin:
                      0,
                  }}
                >
                  Add New Test
                </h2>

                <p
                  style={{
                    margin:
                      "5px 0 0",
                    color:
                      "#718096",
                    fontSize:
                      "12px",
                  }}
                >
                  New laboratory
                  investigation add
                  karein.
                </p>
              </div>

              <button
                onClick={() =>
                  setShowNewTest(
                    false
                  )
                }
                style={
                  closeButton
                }
              >
                ×
              </button>
            </div>

            <form
              onSubmit={
                saveNewTest
              }
            >
              <div
                style={
                  formGrid
                }
              >
                <Field
                  label="Test Name *"
                  value={
                    newTest.name
                  }
                  onChange={(
                    value
                  ) =>
                    setNewTest({
                      ...newTest,
                      name: value,
                    })
                  }
                  placeholder="Complete Blood Count"
                />

                <Field
                  label="Short Name"
                  value={
                    newTest.short_name
                  }
                  onChange={(
                    value
                  ) =>
                    setNewTest({
                      ...newTest,
                      short_name:
                        value,
                    })
                  }
                  placeholder="CBC"
                />

                <SelectField
                  label="Category"
                  value={
                    newTest.category
                  }
                  onChange={(
                    value
                  ) =>
                    setNewTest({
                      ...newTest,
                      category:
                        value,
                    })
                  }
                  options={CATEGORIES.filter(
                    (x) =>
                      x !== "All"
                  )}
                />

                <Field
                  label="Department"
                  value={
                    newTest.department
                  }
                  onChange={(
                    value
                  ) =>
                    setNewTest({
                      ...newTest,
                      department:
                        value,
                    })
                  }
                  placeholder="Laboratory"
                />

                <Field
                  label="Sample Type"
                  value={
                    newTest.sample_type
                  }
                  onChange={(
                    value
                  ) =>
                    setNewTest({
                      ...newTest,
                      sample_type:
                        value,
                    })
                  }
                  placeholder="Serum / EDTA Blood / Urine"
                />

                <Field
                  label="Price ₹"
                  type="number"
                  value={
                    newTest.price
                  }
                  onChange={(
                    value
                  ) =>
                    setNewTest({
                      ...newTest,
                      price:
                        value,
                    })
                  }
                  placeholder="250"
                />

                <Field
                  label="Method"
                  value={
                    newTest.method
                  }
                  onChange={(
                    value
                  ) =>
                    setNewTest({
                      ...newTest,
                      method:
                        value,
                    })
                  }
                  placeholder="Automated / Manual"
                />
              </div>

              <label
                style={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  gap:
                    "8px",
                  marginTop:
                    "15px",
                  fontSize:
                    "13px",
                  fontWeight:
                    "700",
                }}
              >
                <input
                  type="checkbox"
                  checked={
                    newTest.active
                  }
                  onChange={(e) =>
                    setNewTest({
                      ...newTest,
                      active:
                        e.target
                          .checked,
                    })
                  }
                />

                Active Test
              </label>

              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "flex-end",
                  gap:
                    "8px",
                  marginTop:
                    "20px",
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    setShowNewTest(
                      false
                    )
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
                  disabled={
                    saving
                  }
                  style={buttonStyle(
                    "#0e9f99",
                    "#ffffff"
                  )}
                >
                  {saving
                    ? "Saving..."
                    : "✓ Save Test"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================
// FIELD
// =========================================================

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

// =========================================================
// SELECT
// =========================================================

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

// =========================================================
// BADGE
// =========================================================

function Badge({
  children,
}) {
  return (
    <span
      style={{
        background:
          "#eef5f7",
        color:
          "#526775",
        borderRadius:
          "15px",
        padding:
          "4px 8px",
        fontSize:
          "10px",
        fontWeight:
          "700",
      }}
    >
      {children}
    </span>
  );
}

// =========================================================
// STYLES
// =========================================================

const inputStyle = {
  width:
    "100%",
  boxSizing:
    "border-box",
  padding:
    "11px 12px",
  border:
    "1px solid #d7e0e8",
  borderRadius:
    "7px",
  outline:
    "none",
  fontSize:
    "13px",
  background:
    "#ffffff",
};

const labelStyle = {
  display:
    "block",
  marginBottom:
    "6px",
  fontSize:
    "12px",
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
  gap:
    "12px",
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
    "9px 13px",
  borderRadius:
    "7px",
  cursor:
    "pointer",
  fontWeight:
    "800",
  fontSize:
    "12px",
});

const smallButton = {
  border:
    "1px solid #d6dee6",
  background:
    "#ffffff",
  color:
    "#176b67",
  padding:
    "6px 9px",
  borderRadius:
    "5px",
  cursor:
    "pointer",
  fontWeight:
    "700",
  fontSize:
    "10px",
};

const priceButton = {
  border:
    "1px solid #9bd5cf",
  background:
    "#effbf9",
  color:
    "#08756e",
  padding:
    "7px 10px",
  borderRadius:
    "6px",
  cursor:
    "pointer",
  fontWeight:
    "800",
  fontSize:
    "11px",
};

const emptyStyle = {
  padding:
    "55px 20px",
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
    "rgba(15,23,42,0.48)",
  display:
    "flex",
  justifyContent:
    "center",
  alignItems:
    "center",
  padding:
    "20px",
  zIndex:
    100,
};

const modalStyle = {
  background:
    "#ffffff",
  width:
    "100%",
  maxWidth:
    "560px",
  maxHeight:
    "90vh",
  overflowY:
    "auto",
  borderRadius:
    "12px",
  padding:
    "20px",
  boxShadow:
    "0 20px 60px rgba(0,0,0,0.25)",
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
};
