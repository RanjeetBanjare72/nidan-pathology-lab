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
   HELPERS
========================================================= */

function cleanNumber(value) {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

function parseOptions(value) {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return [];
  }

  if (
    typeof value === "object"
  ) {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return {
      text: String(value),
    };
  }
}

function formatOptions(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  if (
    typeof value === "string"
  ) {
    return value;
  }

  try {
    return JSON.stringify(
      value,
      null,
      2
    );
  } catch {
    return String(value);
  }
}

/* =========================================================
   MAIN
========================================================= */

export default function TestMasterPage() {
  const router = useRouter();

  const [tests, setTests] = useState([]);
  const [prices, setPrices] = useState([]);
  const [parameters, setParameters] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [category, setCategory] =
    useState("All");

  const [selectedTest, setSelectedTest] =
    useState(null);

  /* =======================================================
     EDIT TEST MODAL
  ======================================================= */

  const [
    showEditModal,
    setShowEditModal,
  ] = useState(false);

  const [
    editingTestId,
    setEditingTestId,
  ] = useState(null);

  const [
    testForm,
    setTestForm,
  ] = useState({
    ...EMPTY_TEST,
  });

  /* =======================================================
     PRICE MODAL
  ======================================================= */

  const [
    showPriceModal,
    setShowPriceModal,
  ] = useState(false);

  const [
    priceTest,
    setPriceTest,
  ] = useState(null);

  const [
    priceValue,
    setPriceValue,
  ] = useState("");

  /* =======================================================
     PARAMETER MODAL
  ======================================================= */

  const [
    showParameterModal,
    setShowParameterModal,
  ] = useState(false);

  const [
    parameterForm,
    setParameterForm,
  ] = useState({
    ...EMPTY_PARAMETER,
  });

  /* =======================================================
     LOAD TESTS
  ======================================================= */

  async function loadTests() {
    try {
      setLoading(true);

      const {
        data,
        error,
      } = await supabase
        .from("tests")
        .select("*")
        .order("name", {
          ascending: true,
        });

      if (error) {
        throw error;
      }

      setTests(data || []);
    } catch (error) {
      console.error(error);

      alert(
        "Tests load nahi ho paaye:\n" +
          error.message
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     LOAD PRICES
  ======================================================= */

  async function loadPrices() {
    try {
      const {
        data,
        error,
      } = await supabase
        .from("test_prices")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      setPrices(data || []);
    } catch (error) {
      console.warn(
        "Price loading warning:",
        error
      );

      setPrices([]);
    }
  }

  /* =======================================================
     LOAD PARAMETERS
  ======================================================= */

  async function loadParameters(
    testId
  ) {
    if (!testId) {
      setParameters([]);
      return [];
    }

    try {
      const {
        data,
        error,
      } = await supabase
        .from("test_parameters")
        .select("*")
        .eq(
          "test_id",
          testId
        )
        .order("sort_order", {
          ascending: true,
        });

      if (error) {
        throw error;
      }

      const result =
        data || [];

      setParameters(
        result
      );

      return result;
    } catch (error) {
      console.error(error);

      alert(
        "Parameters load nahi ho paaye:\n" +
          error.message
      );

      setParameters([]);

      return [];
    }
  }

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    async function init() {
      await Promise.all([
        loadTests(),
        loadPrices(),
      ]);
    }

    init();
  }, []);

  /* =======================================================
     CURRENT PRICE
  ======================================================= */

  function getTestPrice(
    test
  ) {
    const priceRow =
      prices.find(
        (item) =>
          String(
            item.test_id
          ) ===
            String(test.id) &&
          item.is_active !==
            false
      );

    if (priceRow) {
      return Number(
        priceRow.price || 0
      );
    }

    return Number(
      test.price || 0
    );
  }

  /* =======================================================
     NEW TEST
  ======================================================= */

  function openNewTest() {
    setEditingTestId(null);

    setSelectedTest(null);

    setParameters([]);

    setTestForm({
      ...EMPTY_TEST,
    });

    setShowEditModal(true);

    setShowPriceModal(false);

    setShowParameterModal(
      false
    );
  }

  /* =======================================================
     EDIT TEST
  ======================================================= */

  async function openEditTest(
    test
  ) {
    setEditingTestId(
      test.id
    );

    setSelectedTest(test);

    setTestForm({
      name:
        test.name || "",

      short_name:
        test.short_name || "",

      category:
        test.category ||
        "Hematology",

      department:
        test.department ||
        "Laboratory",

      sample_type:
        test.sample_type ||
        "",

      price:
        test.price ===
          null ||
        test.price ===
          undefined
          ? ""
          : String(
              test.price
            ),

      method:
        test.method || "",

      active:
        test.active !==
        false,
    });

    await loadParameters(
      test.id
    );

    setShowEditModal(true);

    setShowPriceModal(false);

    setShowParameterModal(
      false
    );
  }

  /* =======================================================
     SELECT TEST
  ======================================================= */

  async function selectTest(
    test
  ) {
    setSelectedTest(test);

    await loadParameters(
      test.id
    );
  }

  /* =======================================================
     UPDATE TEST BASIC
  ======================================================= */

  async function updateTestBasic() {
    if (!editingTestId) {
      throw new Error(
        "Test ID missing."
      );
    }

    if (
      !testForm.name.trim()
    ) {
      throw new Error(
        "Test name zaroori hai."
      );
    }

    const payload = {
      name:
        testForm.name.trim(),

      short_name:
        testForm.short_name.trim(),

      category:
        testForm.category,

      department:
        testForm.department.trim(),

      sample_type:
        testForm.sample_type.trim(),

      price:
        testForm.price === ""
          ? 0
          : Number(
              testForm.price
            ),

      method:
        testForm.method.trim(),

      active:
        testForm.active,

      updated_at:
        new Date().toISOString(),
    };

    const {
      data,
      error,
    } = await supabase
      .from("tests")
      .update(payload)
      .eq(
        "id",
        editingTestId
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    setSelectedTest(data);

    return data;
  }

  /* =======================================================
     UPDATE ALL PARAMETERS

     IMPORTANT:
     test_parameters table me updated_at column nahi hai.

     Isliye yahan updated_at NAHI bheja ja raha hai.
  ======================================================= */

  async function updateAllParameters() {
    for (
      const parameter of parameters
    ) {
      if (!parameter.id) {
        continue;
      }

      const payload = {
        parameter_name:
          String(
            parameter.parameter_name ||
              ""
          ).trim(),

        unit:
          String(
            parameter.unit ||
              ""
          ).trim(),

        min_value:
          cleanNumber(
            parameter.min_value
          ),

        max_value:
          cleanNumber(
            parameter.max_value
          ),

        reference_range:
          String(
            parameter.reference_range ||
              ""
          ).trim(),

        options:
          parseOptions(
            parameter.options
          ),

        sort_order:
          Number(
            parameter.sort_order
          ) || 1,

        active:
          parameter.active !==
          false,
      };

      if (
        !payload.parameter_name
      ) {
        throw new Error(
          "Parameter name empty nahi ho sakta."
        );
      }

      const {
        error,
      } = await supabase
        .from(
          "test_parameters"
        )
        .update(payload)
        .eq(
          "id",
          parameter.id
        );

      if (error) {
        throw error;
      }
    }
  }

  /* =======================================================
     SAVE TEST + PARAMETERS
  ======================================================= */

  async function saveEverything(
    event
  ) {
    event.preventDefault();

    if (
      !testForm.name.trim()
    ) {
      alert(
        "Test name zaroori hai."
      );

      return;
    }

    try {
      setSaving(true);

      /* ===============================================
         NEW TEST
      =============================================== */

      if (!editingTestId) {
        const now =
          new Date().toISOString();

        const payload = {
          name:
            testForm.name.trim(),

          short_name:
            testForm.short_name.trim(),

          category:
            testForm.category,

          department:
            testForm.department.trim(),

          sample_type:
            testForm.sample_type.trim(),

          price:
            testForm.price === ""
              ? 0
              : Number(
                  testForm.price
                ),

          method:
            testForm.method.trim(),

          active:
            testForm.active,

          created_at: now,

          updated_at: now,
        };

        const {
          data,
          error,
        } = await supabase
          .from("tests")
          .insert([
            payload,
          ])
          .select()
          .single();

        if (error) {
          throw error;
        }

        setSelectedTest(data);

        setEditingTestId(
          data.id
        );

        await Promise.all([
          loadTests(),
          loadPrices(),
        ]);

        alert(
          "New test successfully added."
        );

        setShowEditModal(
          false
        );

        return;
      }

      /* ===============================================
         EXISTING TEST
      =============================================== */

      await updateTestBasic();

      await updateAllParameters();

      await Promise.all([
        loadTests(),
        loadPrices(),
        loadParameters(
          editingTestId
        ),
      ]);

      alert(
        "Test + Normal Value + Reference Range successfully updated."
      );

      setShowEditModal(
        false
      );
    } catch (error) {
      console.error(error);

      alert(
        "Update nahi hua:\n" +
          error.message
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     CHANGE PARAMETER
  ======================================================= */

  function changeParameter(
    parameterId,
    field,
    value
  ) {
    setParameters(
      (old) =>
        old.map(
          (item) =>
            item.id ===
            parameterId
              ? {
                  ...item,
                  [field]:
                    value,
                }
              : item
        )
    );
  }

  /* =======================================================
     ADD PARAMETER
  ======================================================= */

  function openAddParameter() {
    if (!editingTestId) {
      alert(
        "Pehle test save karein."
      );

      return;
    }

    setParameterForm({
      ...EMPTY_PARAMETER,

      sort_order:
        parameters.length +
        1,
    });

    setShowParameterModal(
      true
    );
  }

  /* =======================================================
     SAVE NEW PARAMETER
  ======================================================= */

  async function saveNewParameter(
    event
  ) {
    event.preventDefault();

    if (!editingTestId) {
      alert(
        "Test select nahi hai."
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

      const payload = {
        test_id:
          editingTestId,

        parameter_name:
          parameterForm.parameter_name.trim(),

        unit:
          parameterForm.unit.trim(),

        min_value:
          cleanNumber(
            parameterForm.min_value
          ),

        max_value:
          cleanNumber(
            parameterForm.max_value
          ),

        reference_range:
          parameterForm.reference_range.trim(),

        options:
          parseOptions(
            parameterForm.options
          ),

        sort_order:
          Number(
            parameterForm.sort_order
          ) || 1,

        active:
          parameterForm.active,

        created_at:
          new Date().toISOString(),
      };

      const {
        error,
      } = await supabase
        .from(
          "test_parameters"
        )
        .insert([
          payload,
        ]);

      if (error) {
        throw error;
      }

      await loadParameters(
        editingTestId
      );

      setShowParameterModal(
        false
      );

      setParameterForm({
        ...EMPTY_PARAMETER,
      });

      alert(
        "Parameter successfully added."
      );
    } catch (error) {
      console.error(error);

      alert(
        "Parameter add nahi hua:\n" +
          error.message
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     DELETE PARAMETER
  ======================================================= */

  async function deleteParameter(
    parameter
  ) {
    const ok =
      window.confirm(
        `Kya "${parameter.parameter_name}" delete karna hai?`
      );

    if (!ok) {
      return;
    }

    try {
      setSaving(true);

      const {
        error,
      } = await supabase
        .from(
          "test_parameters"
        )
        .delete()
        .eq(
          "id",
          parameter.id
        );

      if (error) {
        throw error;
      }

      await loadParameters(
        editingTestId ||
          selectedTest?.id
      );

      alert(
        "Parameter deleted."
      );
    } catch (error) {
      console.error(error);

      alert(
        "Parameter delete nahi hua:\n" +
          error.message
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     PRICE EDITOR
  ======================================================= */

  function openPriceEditor(
    test
  ) {
    setPriceTest(test);

    setPriceValue(
      String(
        getTestPrice(test)
      )
    );

    setShowPriceModal(true);

    setShowEditModal(false);

    setShowParameterModal(
      false
    );
  }

  /* =======================================================
     SAVE PRICE
  ======================================================= */

  async function savePrice(
    event
  ) {
    event.preventDefault();

    if (!priceTest) {
      return;
    }

    const numericPrice =
      Number(priceValue);

    if (
      !Number.isFinite(
        numericPrice
      ) ||
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
        String(
          priceTest.id
        );

      const {
        data: existing,
        error,
      } = await supabase
        .from(
          "test_prices"
        )
        .select("*")
        .eq(
          "test_id",
          testId
        )
        .eq(
          "is_active",
          true
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        )
        .limit(1);

      if (error) {
        throw error;
      }

      if (
        existing &&
        existing.length > 0
      ) {
        const {
          error:
            updateError,
        } = await supabase
          .from(
            "test_prices"
          )
          .update({
            price:
              numericPrice,

            test_name:
              priceTest.name,

            category:
              priceTest.category,

            is_active:
              true,

            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            existing[0].id
          );

        if (updateError) {
          throw updateError;
        }
      } else {
        const {
          error:
            insertError,
        } = await supabase
          .from(
            "test_prices"
          )
          .insert([
            {
              test_id:
                testId,

              test_name:
                priceTest.name,

              category:
                priceTest.category,

              price:
                numericPrice,

              is_active:
                true,

              created_at:
                new Date().toISOString(),

              updated_at:
                new Date().toISOString(),
            },
          ]);

        if (insertError) {
          throw insertError;
        }
      }

      /* Sync tests table */

      const {
        error:
          syncError,
      } = await supabase
        .from("tests")
        .update({
          price:
            numericPrice,

          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          priceTest.id
        );

      if (syncError) {
        console.warn(
          "Price sync warning:",
          syncError
        );
      }

      await Promise.all([
        loadTests(),
        loadPrices(),
      ]);

      setShowPriceModal(
        false
      );

      alert(
        "Price successfully updated."
      );
    } catch (error) {
      console.error(error);

      alert(
        "Price save nahi hua:\n" +
          error.message
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     TOGGLE TEST
  ======================================================= */

  async function toggleTest(
    test
  ) {
    try {
      const {
        error,
      } = await supabase
        .from("tests")
        .update({
          active:
            !test.active,

          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          test.id
        );

      if (error) {
        throw error;
      }

      await loadTests();
    } catch (error) {
      alert(
        "Status update nahi hua:\n" +
          error.message
      );
    }
  }

  /* =======================================================
     DELETE TEST
  ======================================================= */

  async function deleteTest(
    test
  ) {
    const ok =
      window.confirm(
        `Kya "${test.name}" ko delete karna hai?\n\nIske parameters bhi delete honge.`
      );

    if (!ok) {
      return;
    }

    try {
      setSaving(true);

      const {
        error:
          parameterError,
      } = await supabase
        .from(
          "test_parameters"
        )
        .delete()
        .eq(
          "test_id",
          test.id
        );

      if (parameterError) {
        throw parameterError;
      }

      const {
        error:
          testError,
      } = await supabase
        .from("tests")
        .delete()
        .eq(
          "id",
          test.id
        );

      if (testError) {
        throw testError;
      }

      if (
        selectedTest?.id ===
        test.id
      ) {
        setSelectedTest(
          null
        );

        setParameters([]);
      }

      await Promise.all([
        loadTests(),
        loadPrices(),
      ]);

      alert(
        "Test successfully deleted."
      );
    } catch (error) {
      console.error(error);

      alert(
        "Delete nahi hua:\n" +
          error.message
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     FILTER
  ======================================================= */

  const filteredTests =
    useMemo(() => {
      const q =
        search
          .toLowerCase()
          .trim();

      return tests.filter(
        (test) => {
          const matchesSearch =
            !q ||
            (test.name || "")
              .toLowerCase()
              .includes(q) ||
            (test.short_name ||
              "")
              .toLowerCase()
              .includes(q) ||
            (test.category ||
              "")
              .toLowerCase()
              .includes(q) ||
            (test.sample_type ||
              "")
              .toLowerCase()
              .includes(q);

          const matchesCategory =
            category ===
              "All" ||
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

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      style={
        pageStyle
      }
    >
      {/* HEADER */}

      <header
        style={
          headerStyle
        }
      >
        <div>
          <div
            style={
              eyebrowStyle
            }
          >
            NIDAN PATHOLOGY LAB
          </div>

          <h1
            style={{
              margin:
                "2px 0",
              fontSize:
                "22px",
            }}
          >
            Test Master
          </h1>

          <p
            style={
              subTextStyle
            }
          >
            Tests, prices,
            parameters &
            reference ranges
            manage karein
          </p>
        </div>

        <div
          style={
            buttonRow
          }
        >
          <button
            onClick={() =>
              router.push("/")
            }
            style={buttonStyle(
              "#fff",
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
              "#fff"
            )}
          >
            + New Test
          </button>
        </div>
      </header>

      <main
        style={
          mainStyle
        }
      >
        {/* SEARCH */}

        <div
          style={
            searchCardStyle
          }
        >
          <div
            style={
              searchGrid
            }
          >
            <input
              value={
                search
              }
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
              value={
                category
              }
              onChange={(e) =>
                setCategory(
                  e.target.value
                )
              }
              style={
                inputStyle
              }
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
        </div>

        {/* CONTENT */}

        <div
          style={
            contentGrid
          }
        >
          {/* TEST LIST */}

          <section
            style={
              cardStyle
            }
          >
            <div
              style={
                listHeader
              }
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize:
                      "16px",
                  }}
                >
                  Laboratory Tests
                </h2>

                <p
                  style={
                    subTextStyle
                  }
                >
                  {
                    filteredTests.length
                  }{" "}
                  investigations
                </p>
              </div>

              <button
                onClick={async () => {
                  await Promise.all([
                    loadTests(),
                    loadPrices(),
                  ]);
                }}
                style={
                  smallButton
                }
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
                Loading...
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
                      "35px",
                  }}
                >
                  🧪
                </div>

                <strong>
                  No tests found
                </strong>

                <p>
                  Search clear karein
                  ya New Test add
                  karein.
                </p>
              </div>
            ) : (
              filteredTests.map(
                (test) => (
                  <div
                    key={
                      test.id
                    }
                    onClick={() =>
                      selectTest(
                        test
                      )
                    }
                    style={{
                      padding:
                        "12px",
                      borderBottom:
                        "1px solid #edf1f5",
                      background:
                        selectedTest?.id ===
                        test.id
                          ? "#ecfbf9"
                          : "#fff",
                      cursor:
                        "pointer",
                    }}
                  >
                    <div
                      style={
                        testRow
                      }
                    >
                      <div
                        style={{
                          flex: 1,
                          minWidth:
                            0,
                        }}
                      >
                        <strong
                          style={{
                            fontSize:
                              "12px",
                          }}
                        >
                          {
                            test.name
                          }
                        </strong>

                        <span
                          style={{
                            marginLeft:
                              "5px",
                            fontSize:
                              "8px",
                            color:
                              test.active
                                ? "#087f68"
                                : "#b42323",
                            fontWeight:
                              "900",
                          }}
                        >
                          {test.active
                            ? "ACTIVE"
                            : "INACTIVE"}
                        </span>

                        <div
                          style={
                            badgeRow
                          }
                        >
                          <Badge>
                            {
                              test.category
                            }
                          </Badge>

                          <Badge>
                            ₹
                            {
                              getTestPrice(
                                test
                              )
                            }
                          </Badge>

                          <Badge>
                            {test.sample_type ||
                              "Sample"}
                          </Badge>
                        </div>
                      </div>

                      <div
                        style={
                          actionRow
                        }
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
                          style={
                            smallButton
                          }
                        >
                          💰 Edit Price
                        </button>

                        <button
                          onClick={(
                            e
                          ) => {
                            e.stopPropagation();

                            openEditTest(
                              test
                            );
                          }}
                          style={{
                            ...smallButton,
                            background:
                              "#eefcfb",
                            color:
                              "#087f68",
                          }}
                        >
                          ✏️ Edit
                        </button>

                        <button
                          onClick={(
                            e
                          ) => {
                            e.stopPropagation();

                            toggleTest(
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
                )
              )
            )}
          </section>

          {/* RIGHT SIDE */}

          <section
            style={
              cardStyle
            }
          >
            {!selectedTest ? (
              <div
                style={
                  emptyStyle
                }
              >
                <div
                  style={{
                    fontSize:
                      "40px",
                  }}
                >
                  📋
                </div>

                <h3>
                  Select a Test
                </h3>

                <p>
                  Test select karne par
                  parameters yahan
                  dikhenge.
                </p>
              </div>
            ) : (
              <div
                style={{
                  padding:
                    "15px",
                }}
              >
                <div
                  style={
                    selectedHeader
                  }
                >
                  <div>
                    <div
                      style={
                        eyebrowStyle
                      }
                    >
                      SELECTED TEST
                    </div>

                    <h2
                      style={{
                        margin:
                          "4px 0",
                        fontSize:
                          "18px",
                      }}
                    >
                      {
                        selectedTest.name
                      }
                    </h2>
                  </div>

                  <button
                    onClick={() =>
                      openEditTest(
                        selectedTest
                      )
                    }
                    style={
                      smallButton
                    }
                  >
                    ✏️ Edit
                  </button>
                </div>

                <hr
                  style={
                    hrStyle
                  }
                />

                <h3
                  style={{
                    margin:
                      "0 0 8px",
                    fontSize:
                      "14px",
                  }}
                >
                  Parameters (
                  {
                    parameters.length
                  }
                  )
                </h3>

                {parameters.length ===
                0 ? (
                  <div
                    style={
                      emptyStyle
                    }
                  >
                    No parameters
                  </div>
                ) : (
                  parameters.map(
                    (p) => (
                      <ParameterPreview
                        key={
                          p.id
                        }
                        parameter={
                          p
                        }
                      />
                    )
                  )
                )}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* =====================================================
          EDIT TEST MODAL
      ===================================================== */}

      {showEditModal && (
        <div
          style={
            overlayStyle
          }
        >
          <div
            style={
              largeModalStyle
            }
          >
            <div
              style={
                modalHeader
              }
            >
              <div>
                <div
                  style={
                    eyebrowStyle
                  }
                >
                  TEST MASTER
                </div>

                <h2
                  style={{
                    margin:
                      "3px 0",
                    fontSize:
                      "20px",
                  }}
                >
                  {editingTestId
                    ? "Edit Test & Reference Ranges"
                    : "Add New Test"}
                </h2>

                <p
                  style={
                    subTextStyle
                  }
                >
                  Test details aur
                  normal/reference values
                  yahin se manage karein.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowEditModal(
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
                saveEverything
              }
            >
              {/* TEST INFORMATION */}

              <div
                style={
                  sectionBox
                }
              >
                <div
                  style={
                    sectionTitle
                  }
                >
                  1. Test Information
                </div>

                <div
                  style={
                    formGrid
                  }
                >
                  <Field
                    label="Test Name *"
                    value={
                      testForm.name
                    }
                    onChange={(v) =>
                      setTestForm({
                        ...testForm,
                        name: v,
                      })
                    }
                    placeholder="Complete Blood Count (CBC)"
                  />

                  <Field
                    label="Short Name"
                    value={
                      testForm.short_name
                    }
                    onChange={(v) =>
                      setTestForm({
                        ...testForm,
                        short_name:
                          v,
                      })
                    }
                    placeholder="CBC"
                  />

                  <SelectField
                    label="Category"
                    value={
                      testForm.category
                    }
                    onChange={(v) =>
                      setTestForm({
                        ...testForm,
                        category:
                          v,
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
                    onChange={(v) =>
                      setTestForm({
                        ...testForm,
                        department:
                          v,
                      })
                    }
                    placeholder="Laboratory"
                  />

                  <Field
                    label="Sample Type"
                    value={
                      testForm.sample_type
                    }
                    onChange={(v) =>
                      setTestForm({
                        ...testForm,
                        sample_type:
                          v,
                      })
                    }
                    placeholder="EDTA Blood / Serum"
                  />

                  <Field
                    label="Price ₹"
                    type="number"
                    value={
                      testForm.price
                    }
                    onChange={(v) =>
                      setTestForm({
                        ...testForm,
                        price: v,
                      })
                    }
                    placeholder="250"
                  />

                  <Field
                    label="Method"
                    value={
                      testForm.method
                    }
                    onChange={(v) =>
                      setTestForm({
                        ...testForm,
                        method: v,
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
                  onChange={(v) =>
                    setTestForm({
                      ...testForm,
                      active:
                        v,
                    })
                  }
                />
              </div>

              {/* PARAMETERS */}

              {editingTestId && (
                <div
                  style={
                    sectionBox
                  }
                >
                  <div
                    style={
                      sectionTop
                    }
                  >
                    <div>
                      <div
                        style={
                          sectionTitle
                        }
                      >
                        2. Parameters &
                        Normal / Reference
                        Values
                      </div>

                      <div
                        style={
                          helpStyle
                        }
                      >
                        Normal Min, Max,
                        Unit aur Reference
                        Range yahin change
                        karein.
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={
                        openAddParameter
                      }
                      style={buttonStyle(
                        "#0e9f99",
                        "#fff"
                      )}
                    >
                      + Add Parameter
                    </button>
                  </div>

                  {parameters.length ===
                  0 ? (
                    <div
                      style={
                        noParameterBox
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

                      <strong>
                        No parameters
                      </strong>

                      <p
                        style={{
                          fontSize:
                            "10px",
                        }}
                      >
                        + Add Parameter
                        par click karein.
                      </p>
                    </div>
                  ) : (
                    <div
                      style={
                        parameterList
                      }
                    >
                      {parameters.map(
                        (
                          parameter,
                          index
                        ) => (
                          <ParameterEditor
                            key={
                              parameter.id
                            }
                            parameter={
                              parameter
                            }
                            index={
                              index
                            }
                            onChange={
                              changeParameter
                            }
                            onDelete={() =>
                              deleteParameter(
                                parameter
                              )
                            }
                          />
                        )
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* FOOTER */}

              <div
                style={
                  modalActions
                }
              >
                <button
                  type="button"
                  onClick={() =>
                    setShowEditModal(
                      false
                    )
                  }
                  style={buttonStyle(
                    "#fff",
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
                    "#fff"
                  )}
                >
                  {saving
                    ? "Saving..."
                    : editingTestId
                    ? "✓ Update Test & Reference Ranges"
                    : "✓ Save Test"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          PRICE MODAL
      ===================================================== */}

      {showPriceModal &&
        priceTest && (
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
              <ModalHeader
                title="Edit Test Price"
                subtitle={
                  priceTest.name
                }
                onClose={() =>
                  setShowPriceModal(
                    false
                  )
                }
              />

              <div
                style={
                  priceInfo
                }
              >
                Current Price:{" "}
                <strong>
                  ₹
                  {
                    getTestPrice(
                      priceTest
                    )
                  }
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

                <div
                  style={
                    modalActions
                  }
                >
                  <button
                    type="button"
                    onClick={() =>
                      setShowPriceModal(
                        false
                      )
                    }
                    style={buttonStyle(
                      "#fff",
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
                      "#fff"
                    )}
                  >
                    {saving
                      ? "Saving..."
                      : "Save Price"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      {/* =====================================================
          ADD PARAMETER MODAL
      ===================================================== */}

      {showParameterModal && (
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
            <ModalHeader
              title="Add Parameter"
              subtitle={
                testForm.name
              }
              onClose={() =>
                setShowParameterModal(
                  false
                )
              }
            />

            <form
              onSubmit={
                saveNewParameter
              }
            >
              <Field
                label="Parameter Name *"
                value={
                  parameterForm.parameter_name
                }
                onChange={(v) =>
                  setParameterForm({
                    ...parameterForm,
                    parameter_name:
                      v,
                  })
                }
                placeholder="Haemoglobin"
              />

              <div
                style={
                  formGrid
                }
              >
                <Field
                  label="Unit"
                  value={
                    parameterForm.unit
                  }
                  onChange={(v) =>
                    setParameterForm({
                      ...parameterForm,
                      unit: v,
                    })
                  }
                  placeholder="g/dL"
                />

                <Field
                  label="Normal Min"
                  type="number"
                  value={
                    parameterForm.min_value
                  }
                  onChange={(v) =>
                    setParameterForm({
                      ...parameterForm,
                      min_value:
                        v,
                    })
                  }
                  placeholder="13"
                />

                <Field
                  label="Normal Max"
                  type="number"
                  value={
                    parameterForm.max_value
                  }
                  onChange={(v) =>
                    setParameterForm({
                      ...parameterForm,
                      max_value:
                        v,
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
                  onChange={(v) =>
                    setParameterForm({
                      ...parameterForm,
                      sort_order:
                        v,
                    })
                  }
                  placeholder="1"
                />
              </div>

              <div
                style={{
                  marginTop:
                    "12px",
                }}
              >
                <label
                  style={
                    labelStyle
                  }
                >
                  Normal Value /
                  Reference Range
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
                  style={
                    textareaStyle
                  }
                />

                <div
                  style={
                    helpStyle
                  }
                >
                  Example: Male: 13-17
                  g/dL | Female:
                  12-15 g/dL
                </div>
              </div>

              <div
                style={{
                  marginTop:
                    "12px",
                }}
              >
                <label
                  style={
                    labelStyle
                  }
                >
                  Options / Choices
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
                  placeholder='{"choices":["Positive","Negative"]}'
                  style={{
                    ...textareaStyle,
                    fontFamily:
                      "monospace",
                  }}
                />
              </div>

              <Checkbox
                label="Active Parameter"
                checked={
                  parameterForm.active
                }
                onChange={(v) =>
                  setParameterForm({
                    ...parameterForm,
                    active:
                      v,
                  })
                }
              />

              <div
                style={
                  modalActions
                }
              >
                <button
                  type="button"
                  onClick={() =>
                    setShowParameterModal(
                      false
                    )
                  }
                  style={buttonStyle(
                    "#fff",
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
                    "#fff"
                  )}
                >
                  {saving
                    ? "Saving..."
                    : "Save Parameter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   PARAMETER EDITOR
========================================================= */

function ParameterEditor({
  parameter,
  index,
  onChange,
  onDelete,
}) {
  return (
    <div
      style={
        parameterBox
      }
    >
      <div
        style={
          parameterHeader
        }
      >
        <div>
          <strong
            style={{
              fontSize:
                "13px",
            }}
          >
            Parameter #
            {index + 1}
          </strong>

          <span
            style={{
              marginLeft:
                "8px",
              fontSize:
                "9px",
              color:
                parameter.active
                  ? "#087f68"
                  : "#b42323",
              fontWeight:
                "900",
            }}
          >
            {parameter.active
              ? "ACTIVE"
              : "INACTIVE"}
          </span>
        </div>

        <button
          type="button"
          onClick={
            onDelete
          }
          style={{
            ...smallButton,
            color:
              "#b42323",
          }}
        >
          🗑 Delete
        </button>
      </div>

      <div
        style={
          formGrid
        }
      >
        <InlineInput
          label="Parameter Name"
          value={
            parameter.parameter_name ||
            ""
          }
          onChange={(v) =>
            onChange(
              parameter.id,
              "parameter_name",
              v
            )
          }
          placeholder="Haemoglobin"
        />

        <InlineInput
          label="Unit"
          value={
            parameter.unit ||
            ""
          }
          onChange={(v) =>
            onChange(
              parameter.id,
              "unit",
              v
            )
          }
          placeholder="g/dL"
        />

        <InlineInput
          label="Normal Minimum Value"
          type="number"
          value={
            parameter.min_value ??
            ""
          }
          onChange={(v) =>
            onChange(
              parameter.id,
              "min_value",
              v
            )
          }
          placeholder="13"
        />

        <InlineInput
          label="Normal Maximum Value"
          type="number"
          value={
            parameter.max_value ??
            ""
          }
          onChange={(v) =>
            onChange(
              parameter.id,
              "max_value",
              v
            )
          }
          placeholder="17"
        />

        <InlineInput
          label="Sort Order"
          type="number"
          value={
            parameter.sort_order ??
            1
          }
          onChange={(v) =>
            onChange(
              parameter.id,
              "sort_order",
              v
            )
          }
          placeholder="1"
        />

        <div>
          <label
            style={
              labelStyle
            }
          >
            Parameter Active
          </label>

          <label
            style={
              checkboxBox
            }
          >
            <input
              type="checkbox"
              checked={
                parameter.active !==
                false
              }
              onChange={(e) =>
                onChange(
                  parameter.id,
                  "active",
                  e.target.checked
                )
              }
            />

            Active
          </label>
        </div>
      </div>

      {/* REFERENCE RANGE */}

      <div
        style={
          referenceBox
        }
      >
        <label
          style={{
            ...labelStyle,
            color:
              "#087f68",
          }}
        >
          ⭐ Normal Value /
          Reference Range
        </label>

        <textarea
          value={
            parameter.reference_range ||
            ""
          }
          onChange={(e) =>
            onChange(
              parameter.id,
              "reference_range",
              e.target.value
            )
          }
          placeholder="Male: 13-17 g/dL | Female: 12-15 g/dL"
          style={
            textareaStyle
          }
        />

        <div
          style={
            helpStyle
          }
        >
          यही value report में
          normal/reference range
          के रूप में use की जा सकती है।
        </div>
      </div>

      {/* OPTIONS */}

      <div
        style={{
          marginTop:
            "10px",
        }}
      >
        <label
          style={
            labelStyle
          }
        >
          Options / Choices
        </label>

        <textarea
          value={
            formatOptions(
              parameter.options
            )
          }
          onChange={(e) =>
            onChange(
              parameter.id,
              "options",
              e.target.value
            )
          }
          placeholder='{"choices":["Positive","Negative"]}'
          style={{
            ...textareaStyle,
            fontFamily:
              "monospace",
          }}
        />
      </div>
    </div>
  );
}

/* =========================================================
   PARAMETER PREVIEW
========================================================= */

function ParameterPreview({
  parameter,
}) {
  return (
    <div
      style={
        previewBox
      }
    >
      <strong
        style={{
          fontSize:
            "12px",
        }}
      >
        {
          parameter.parameter_name
        }
      </strong>

      <div
        style={
          previewText
        }
      >
        Unit:{" "}
        {parameter.unit ||
          "—"}
      </div>

      <div
        style={
          previewRange
        }
      >
        <strong>
          Normal / Reference:
        </strong>{" "}
        {parameter.reference_range ||
          "Not set"}
      </div>
    </div>
  );
}

/* =========================================================
   INLINE INPUT
========================================================= */

function InlineInput({
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
   SELECT
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
      style={
        checkboxLabel
      }
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
      style={
        badgeStyle
      }
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
              "19px",
          }}
        >
          {title}
        </h2>

        <p
          style={
            subTextStyle
          }
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
    "#fff",
  borderBottom:
    "1px solid #e2e8ef",
  padding:
    "10px 12px",
  display:
    "flex",
  justifyContent:
    "space-between",
  alignItems:
    "center",
  gap:
    "10px",
  position:
    "sticky",
  top: 0,
  zIndex:
    20,
};

const mainStyle = {
  padding:
    "12px",
  maxWidth:
    "1500px",
  margin:
    "auto",
};

const searchCardStyle = {
  background:
    "#fff",
  border:
    "1px solid #e2e8ef",
  borderRadius:
    "9px",
  padding:
    "10px",
  marginBottom:
    "12px",
};

const searchGrid = {
  display:
    "grid",
  gridTemplateColumns:
    "minmax(0, 1fr) 180px",
  gap:
    "8px",
};

const contentGrid = {
  display:
    "grid",
  gridTemplateColumns:
    "minmax(0, 1.3fr) minmax(320px, 0.7fr)",
  gap:
    "12px",
};

const cardStyle = {
  background:
    "#fff",
  border:
    "1px solid #e2e8ef",
  borderRadius:
    "9px",
  overflow:
    "hidden",
};

const listHeader = {
  padding:
    "12px",
  borderBottom:
    "1px solid #e8edf2",
  display:
    "flex",
  justifyContent:
    "space-between",
  alignItems:
    "center",
};

const inputStyle = {
  width:
    "100%",
  boxSizing:
    "border-box",
  padding:
    "9px 10px",
  border:
    "1px solid #d7e0e8",
  borderRadius:
    "7px",
  outline:
    "none",
  fontSize:
    "11px",
  background:
    "#fff",
};

const textareaStyle = {
  width:
    "100%",
  boxSizing:
    "border-box",
  minHeight:
    "65px",
  padding:
    "9px 10px",
  border:
    "1px solid #d7e0e8",
  borderRadius:
    "7px",
  outline:
    "none",
  fontSize:
    "11px",
  resize:
    "vertical",
  background:
    "#fff",
};

const labelStyle = {
  display:
    "block",
  marginBottom:
    "5px",
  fontSize:
    "10px",
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
    "9px",
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
    "7px 10px",
  borderRadius:
    "6px",
  cursor:
    "pointer",
  fontWeight:
    "800",
  fontSize:
    "10px",
});

const smallButton = {
  border:
    "1px solid #d6dee6",
  background:
    "#fff",
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
    "8px",
  whiteSpace:
    "nowrap",
};

const emptyStyle = {
  padding:
    "40px 15px",
  textAlign:
    "center",
  color:
    "#718096",
  fontSize:
    "11px",
};

const overlayStyle = {
  position:
    "fixed",
  inset:
    0,
  background:
    "rgba(15,23,42,0.60)",
  display:
    "flex",
  justifyContent:
    "center",
  alignItems:
    "center",
  padding:
    "10px",
  zIndex:
    100,
};

const modalStyle = {
  background:
    "#fff",
  width:
    "100%",
  maxWidth:
    "600px",
  maxHeight:
    "92vh",
  overflowY:
    "auto",
  borderRadius:
    "11px",
  padding:
    "15px",
  boxShadow:
    "0 20px 60px rgba(0,0,0,0.25)",
};

const largeModalStyle = {
  ...modalStyle,
  maxWidth:
    "900px",
};

const modalHeader = {
  display:
    "flex",
  justifyContent:
    "space-between",
  alignItems:
    "flex-start",
  gap:
    "10px",
  marginBottom:
    "12px",
};

const closeButton = {
  border:
    "none",
  background:
    "#f1f5f9",
  width:
    "30px",
  height:
    "30px",
  borderRadius:
    "50%",
  cursor:
    "pointer",
  fontSize:
    "20px",
  lineHeight:
    "25px",
};

const sectionBox = {
  border:
    "1px solid #e2e8ef",
  borderRadius:
    "9px",
  padding:
    "12px",
  marginBottom:
    "11px",
  background:
    "#fff",
};

const sectionTitle = {
  fontSize:
    "13px",
  fontWeight:
    "900",
  color:
    "#172536",
};

const modalActions = {
  display:
    "flex",
  justifyContent:
    "flex-end",
  gap:
    "7px",
  marginTop:
    "12px",
  paddingTop:
    "10px",
  borderTop:
    "1px solid #e8edf2",
};

const helpStyle = {
  marginTop:
    "4px",
  fontSize:
    "9px",
  color:
    "#64748b",
  lineHeight:
    "1.4",
};

const eyebrowStyle = {
  fontSize:
    "9px",
  fontWeight:
    "900",
  color:
    "#079b94",
  letterSpacing:
    "1px",
};

const subTextStyle = {
  margin:
    "3px 0 0",
  fontSize:
    "10px",
  color:
    "#718096",
};

const buttonRow = {
  display:
    "flex",
  gap:
    "6px",
  flexWrap:
    "wrap",
  justifyContent:
    "flex-end",
};

const testRow = {
  display:
    "flex",
  justifyContent:
    "space-between",
  gap:
    "8px",
};

const badgeRow = {
  marginTop:
    "5px",
  display:
    "flex",
  gap:
    "5px",
  flexWrap:
    "wrap",
};

const actionRow = {
  display:
    "flex",
  alignItems:
    "center",
  gap:
    "4px",
  flexWrap:
    "wrap",
  justifyContent:
    "flex-end",
};

const selectedHeader = {
  display:
    "flex",
  justifyContent:
    "space-between",
  gap:
    "10px",
};

const hrStyle = {
  border:
    "none",
  borderTop:
    "1px solid #e8edf2",
  margin:
    "12px 0",
};

const sectionTop = {
  display:
    "flex",
  justifyContent:
    "space-between",
  alignItems:
    "center",
  gap:
    "10px",
  marginBottom:
    "12px",
};

const noParameterBox = {
  border:
    "1px dashed #cbd5e1",
  borderRadius:
    "8px",
  padding:
    "25px",
  textAlign:
    "center",
  color:
    "#718096",
};

const parameterList = {
  display:
    "flex",
  flexDirection:
    "column",
  gap:
    "12px",
};

const parameterBox = {
  border:
    "1px solid #dce6eb",
  borderRadius:
    "10px",
  padding:
    "12px",
  background:
    "#fbfefe",
};

const parameterHeader = {
  display:
    "flex",
  justifyContent:
    "space-between",
  alignItems:
    "center",
  marginBottom:
    "10px",
};

const checkboxLabel = {
  display:
    "flex",
  alignItems:
    "center",
  gap:
    "7px",
  marginTop:
    "11px",
  fontSize:
    "11px",
  fontWeight:
    "800",
};

const checkboxBox = {
  display:
    "flex",
  alignItems:
    "center",
  gap:
    "7px",
  fontSize:
    "11px",
  padding:
    "10px",
  border:
    "1px solid #d7e0e8",
  borderRadius:
    "7px",
  background:
    "#fff",
};

const referenceBox = {
  marginTop:
    "11px",
  padding:
    "10px",
  border:
    "1px solid #bfe8e3",
  background:
    "#f0fdfa",
  borderRadius:
    "8px",
};

const previewBox = {
  border:
    "1px solid #e3eaf0",
  borderRadius:
    "8px",
  padding:
    "10px",
  marginBottom:
    "7px",
};

const previewText = {
  fontSize:
    "10px",
  color:
    "#667085",
  marginTop:
    "4px",
};

const previewRange = {
  marginTop:
    "6px",
  background:
    "#f0fdfa",
  borderRadius:
    "6px",
  padding:
    "7px",
  fontSize:
    "10px",
};

const priceInfo = {
  padding:
    "10px",
  background:
    "#f0fdfa",
  border:
    "1px solid #ccfbf1",
  borderRadius:
    "8px",
  marginBottom:
    "12px",
};

const badgeStyle = {
  background:
    "#eef5f7",
  color:
    "#536674",
  borderRadius:
    "12px",
  padding:
    "3px 6px",
  fontSize:
    "8px",
  fontWeight:
    "700",
};
