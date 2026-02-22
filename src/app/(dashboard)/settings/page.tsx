/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { DenseTable } from "@/components/ui/DenseTable";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { CrudModal, FieldConfig } from "@/components/ui/CrudModal";
import {
    useUsers, useCustomers, useParameters, useSampleMatrices, useMethods, useInstruments, useUnits,
    useDepartments, useMatrixParameterRules, useTestPackages, usePriceList, useLabSettings,
    useUpdateLabSettings, useInsertRow, useUpdateRow, useDeleteRow, queryKeys
} from "@/hooks/use-supabase";
import { useAuth } from "@/providers/AuthProvider";
import { cn } from "@/lib/utils";
import type { Tables, User, Department, PriceListItem, MatrixParameterRule, TestPackage, AnalystProfile, AnalystCompetency, AnalystCertificate } from "@/types/database";

type Parameter = Tables["parameters"]["Row"];
type SampleMatrix = Tables["sample_matrices"]["Row"];
type Method = Tables["methods"]["Row"];
type Instrument = Tables["instruments"]["Row"];
type Unit = Tables["units"]["Row"];
type Customer = Tables["customers"]["Row"];
type CustomerContact = Tables["customer_contacts"]["Row"];

type SettingsTab = "general" | "users" | "analysts" | "customers" | "parameters" | "matrices" | "methods" | "instruments" | "units" | "packages" | "departments" | "matrix_rules" | "price_list" | "profile" | "competency_skills" | "certificates";

type UserRole = "admin" | "manager" | "analyst";

const ADMIN_MANAGER_TABS: SettingsTab[] = ["general", "users", "analysts", "customers", "departments", "parameters", "matrices", "matrix_rules", "methods", "instruments", "units", "packages", "price_list"];
const ANALYST_TABS: SettingsTab[] = ["profile", "competency_skills", "certificates"];

interface ModalState {
    isOpen: boolean;
    mode: "add" | "edit" | "delete";
    data: Record<string, any>;
    entityType: string;
}

export default function SettingsPage() {
    const { user: authUser } = useAuth();
    const userRole = (authUser?.role || "admin") as UserRole;

    const { data: users = [], isLoading: loadingUsers } = useUsers();
    const { data: customers = [], isLoading: loadingCustomers } = useCustomers();
    const { data: parameters = [], isLoading: loadingParameters } = useParameters();
    const { data: matrices = [], isLoading: loadingMatrices } = useSampleMatrices();
    const { data: methods = [], isLoading: loadingMethods } = useMethods();
    const { data: instruments = [], isLoading: loadingInstruments } = useInstruments();
    const { data: units = [], isLoading: loadingUnits } = useUnits();
    const { data: departments = [], isLoading: loadingDepartments } = useDepartments();
    const { data: matrixRules = [], isLoading: loadingMatrixRules } = useMatrixParameterRules();
    const { data: testPackages = [], isLoading: loadingPackages } = useTestPackages();
    const { data: priceList = [], isLoading: loadingPriceList } = usePriceList();
    const { data: labSettings, isLoading: loadingSettings } = useLabSettings();

    // Analyst data — fetch all profiles with joined user data
    const [analystProfiles, setAnalystProfiles] = useState<(AnalystProfile & { users?: { full_name: string; email: string } })[]>([]);
    const [loadingAnalysts, setLoadingAnalysts] = useState(false);
    const [expandedAnalystId, setExpandedAnalystId] = useState<string | null>(null);
    const [analystCompetencies, setAnalystCompetencies] = useState<AnalystCompetency[]>([]);
    const [analystCertificates, setAnalystCertificates] = useState<AnalystCertificate[]>([]);
    const [loadingAnalystDetails, setLoadingAnalystDetails] = useState(false);

    // Analyst self-service state (analyst role only)
    const [myProfile, setMyProfile] = useState<AnalystProfile | null>(null);
    const [loadingMyProfile, setLoadingMyProfile] = useState(false);
    const [myProfileForm, setMyProfileForm] = useState({
        employee_id: "", specialization: "", education: "", years_experience: 0, job_description: "",
    });
    const [myCompetencies, setMyCompetencies] = useState<AnalystCompetency[]>([]);
    const [myCertificates, setMyCertificates] = useState<AnalystCertificate[]>([]);
    const [loadingMyDetails, setLoadingMyDetails] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const [uploadingCert, setUploadingCert] = useState(false);

    const updateLabSettings = useUpdateLabSettings();

    // Generic CRUD mutation hooks — ALL entities
    const insertUser = useInsertRow<User>("users", queryKeys.users.all);
    const updateUser = useUpdateRow<User>("users", queryKeys.users.all);
    const deleteUser = useDeleteRow("users", queryKeys.users.all);

    const insertCustomer = useInsertRow<Customer>("customers", queryKeys.customers.all);
    const updateCustomer = useUpdateRow<Customer>("customers", queryKeys.customers.all);
    const deleteCustomer = useDeleteRow("customers", queryKeys.customers.all);

    const insertContact = useInsertRow<CustomerContact>("customer_contacts", queryKeys.customerContacts.all);
    const updateContact = useUpdateRow<CustomerContact>("customer_contacts", queryKeys.customerContacts.all);
    const deleteContact = useDeleteRow("customer_contacts", queryKeys.customerContacts.all);

    const insertAnalystProfile = useInsertRow<AnalystProfile>("analyst_profiles", queryKeys.analystProfiles.all);
    const updateAnalystProfile = useUpdateRow<AnalystProfile>("analyst_profiles", queryKeys.analystProfiles.all);
    const deleteAnalystProfile = useDeleteRow("analyst_profiles", queryKeys.analystProfiles.all);

    const insertCompetency = useInsertRow<AnalystCompetency>("analyst_competencies", queryKeys.analystCompetencies.all);
    const updateCompetency = useUpdateRow<AnalystCompetency>("analyst_competencies", queryKeys.analystCompetencies.all);
    const deleteCompetency = useDeleteRow("analyst_competencies", queryKeys.analystCompetencies.all);

    const insertCertificate = useInsertRow<AnalystCertificate>("analyst_certificates", queryKeys.analystCertificates.all);
    const updateCertificate = useUpdateRow<AnalystCertificate>("analyst_certificates", queryKeys.analystCertificates.all);
    const deleteCertificate = useDeleteRow("analyst_certificates", queryKeys.analystCertificates.all);

    const insertParameter = useInsertRow<Parameter>("parameters", queryKeys.parameters.all);
    const updateParameter = useUpdateRow<Parameter>("parameters", queryKeys.parameters.all);
    const deleteParameter = useDeleteRow("parameters", queryKeys.parameters.all);

    const insertMatrix = useInsertRow<SampleMatrix>("sample_matrices", queryKeys.sampleMatrices.all);
    const updateMatrix = useUpdateRow<SampleMatrix>("sample_matrices", queryKeys.sampleMatrices.all);
    const deleteMatrix = useDeleteRow("sample_matrices", queryKeys.sampleMatrices.all);

    const insertMethod = useInsertRow<Method>("methods", queryKeys.methods.all);
    const updateMethod = useUpdateRow<Method>("methods", queryKeys.methods.all);
    const deleteMethod = useDeleteRow("methods", queryKeys.methods.all);

    const insertInstrument = useInsertRow<Instrument>("instruments", queryKeys.instruments.all);
    const updateInstrument = useUpdateRow<Instrument>("instruments", queryKeys.instruments.all);
    const deleteInstrument = useDeleteRow("instruments", queryKeys.instruments.all);

    const insertUnit = useInsertRow<Unit>("units", queryKeys.units.all);
    const updateUnit = useUpdateRow<Unit>("units", queryKeys.units.all);
    const deleteUnit = useDeleteRow("units", queryKeys.units.all);

    const insertDepartment = useInsertRow<Department>("departments", queryKeys.departments.all);
    const updateDepartment = useUpdateRow<Department>("departments", queryKeys.departments.all);
    const deleteDepartment = useDeleteRow("departments", queryKeys.departments.all);

    const insertMatrixRule = useInsertRow<MatrixParameterRule>("matrix_parameter_rules", queryKeys.matrixParameterRules.all);
    const updateMatrixRule = useUpdateRow<MatrixParameterRule>("matrix_parameter_rules", queryKeys.matrixParameterRules.all);
    const deleteMatrixRule = useDeleteRow("matrix_parameter_rules", queryKeys.matrixParameterRules.all);

    const insertTestPackage = useInsertRow<TestPackage>("test_packages", queryKeys.testPackages.all);
    const updateTestPackage = useUpdateRow<TestPackage>("test_packages", queryKeys.testPackages.all);
    const deleteTestPackage = useDeleteRow("test_packages", queryKeys.testPackages.all);

    const insertPriceItem = useInsertRow<PriceListItem>("price_list", queryKeys.priceList.all);
    const updatePriceItem = useUpdateRow<PriceListItem>("price_list", queryKeys.priceList.all);
    const deletePriceItem = useDeleteRow("price_list", queryKeys.priceList.all);

    // Role-based visible tabs
    const visibleTabs = userRole === "analyst" ? ANALYST_TABS : ADMIN_MANAGER_TABS;

    const [activeTab, setActiveTab] = useState<SettingsTab>(visibleTabs[0]);
    // Reset activeTab when visibleTabs change (e.g. after auth loads)
    useEffect(() => {
        if (!visibleTabs.includes(activeTab)) {
            setActiveTab(visibleTabs[0]);
        }
    }, [visibleTabs, activeTab]);
    const [searchQuery, setSearchQuery] = useState("");
    const [modal, setModal] = useState<ModalState>({ isOpen: false, mode: "add", data: {}, entityType: "user" });
    const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);
    const [customerContacts, setCustomerContacts] = useState<CustomerContact[]>([]);
    const [loadingContacts, setLoadingContacts] = useState(false);
    const [expandedPackageId, setExpandedPackageId] = useState<string | null>(null);
    const [packageItems, setPackageItems] = useState<any[]>([]);
    const [loadingPackageItems, setLoadingPackageItems] = useState(false);
    const [showAddItem, setShowAddItem] = useState(false);
    const [newItemForm, setNewItemForm] = useState({ parameter_id: "", method_id: "" });
    const [savingItem, setSavingItem] = useState(false);

    // Fetch analyst profiles when tab is active
    useEffect(() => {
        if (activeTab !== "analysts") return;
        setLoadingAnalysts(true);
        import("@/lib/supabase").then(({ supabase: sb }) => {
            sb.from("analyst_profiles")
                .select("*, users!analyst_profiles_user_id_fkey(full_name, email)")
                .order("created_at", { ascending: false })
                .then(({ data }) => {
                    setAnalystProfiles(data || []);
                    setLoadingAnalysts(false);
                });
        });
    }, [activeTab]);

    // Analyst self-service: fetch own profile + competencies + certificates
    const fetchMyProfile = useCallback(async () => {
        if (userRole !== "analyst" || !authUser?.id) return;
        setLoadingMyProfile(true);
        setLoadingMyDetails(true);
        try {
            const { supabase: sb } = await import("@/lib/supabase");
            // Fetch or create profile
            let { data: profile } = await sb
                .from("analyst_profiles")
                .select("*")
                .eq("user_id", authUser.id)
                .single();

            if (!profile) {
                // Auto-create profile for analyst
                const { data: newProfile } = await sb.from("analyst_profiles").insert({
                    user_id: authUser.id,
                    is_active: true,
                }).select("*").single();
                profile = newProfile;
            }

            if (profile) {
                setMyProfile(profile as AnalystProfile);
                setMyProfileForm({
                    employee_id: profile.employee_id || "",
                    specialization: profile.specialization || "",
                    education: profile.education || "",
                    years_experience: profile.years_experience || 0,
                    job_description: profile.job_description || "",
                });
                // Fetch competencies and certificates
                const [compRes, certRes] = await Promise.all([
                    sb.from("analyst_competencies").select("*").eq("profile_id", profile.id).order("created_at", { ascending: false }),
                    sb.from("analyst_certificates").select("*").eq("profile_id", profile.id).order("created_at", { ascending: false }),
                ]);
                setMyCompetencies(compRes.data || []);
                setMyCertificates(certRes.data || []);
            }
        } catch (err) {
            console.error("Failed to load analyst profile:", err);
        } finally {
            setLoadingMyProfile(false);
            setLoadingMyDetails(false);
        }
    }, [userRole, authUser?.id]);

    useEffect(() => {
        if (userRole === "analyst" && (activeTab === "profile" || activeTab === "competency_skills" || activeTab === "certificates")) {
            fetchMyProfile();
        }
    }, [userRole, activeTab, fetchMyProfile]);

    // Save own profile
    const handleSaveMyProfile = useCallback(async () => {
        if (!myProfile) return;
        setSavingProfile(true);
        try {
            const { supabase: sb } = await import("@/lib/supabase");
            const { error } = await sb.from("analyst_profiles").update(myProfileForm).eq("id", myProfile.id);
            if (error) {
                console.error("Failed to save profile:", error);
                alert(`Gagal menyimpan profil: ${error.message}`);
                return;
            }
            setMyProfile({ ...myProfile, ...myProfileForm } as AnalystProfile);
            alert("Profil berhasil disimpan.");
        } catch (err) {
            console.error("Failed to save profile:", err);
            alert("Gagal menyimpan profil.");
        } finally {
            setSavingProfile(false);
        }
    }, [myProfile, myProfileForm]);

    // Upload certificate document
    const handleCertUpload = useCallback(async (certId: string, file: File) => {
        setUploadingCert(true);
        try {
            const { supabase: sb } = await import("@/lib/supabase");
            const ext = file.name.split(".").pop();
            const path = `certificates/${myProfile?.id}/${certId}.${ext}`;
            const { error: uploadError } = await sb.storage.from("analyst-documents").upload(path, file, { upsert: true });
            if (uploadError) throw uploadError;
            const { data: urlData } = sb.storage.from("analyst-documents").getPublicUrl(path);
            const { error: updateError } = await sb.from("analyst_certificates").update({
                document_url: urlData.publicUrl,
                document_name: file.name,
            }).eq("id", certId);
            if (updateError) throw updateError;
            await fetchMyProfile();
        } catch (err) {
            console.error("Failed to upload certificate:", err);
            alert(`Gagal upload dokumen: ${err instanceof Error ? err.message : "Unknown error"}`);
        } finally {
            setUploadingCert(false);
        }
    }, [myProfile?.id, fetchMyProfile]);

    // General settings form state
    const [settingsForm, setSettingsForm] = useState({
        lab_name: "",
        company_code: "",
        support_email: "",
        support_phone: "",
        address: "",
        accreditation_number: "",
        default_currency: "IDR",
    });
    const [settingsLoaded, setSettingsLoaded] = useState(false);

    // Sync lab settings into form when loaded
    if (labSettings && !settingsLoaded) {
        setSettingsForm({
            lab_name: labSettings.lab_name || "",
            company_code: labSettings.company_code || "",
            support_email: labSettings.support_email || "",
            support_phone: labSettings.support_phone || "",
            address: labSettings.address || "",
            accreditation_number: labSettings.accreditation_number || "",
            default_currency: labSettings.default_currency || "IDR",
        });
        setSettingsLoaded(true);
    }

    const openModal = useCallback((mode: "add" | "edit" | "delete", entityType: string, data: Record<string, any> = {}) => {
        setModal({ isOpen: true, mode, entityType, data });
    }, []);

    const closeModal = useCallback(() => {
        setModal({ isOpen: false, mode: "add", data: {}, entityType: "user" });
    }, []);

    // Field configs — must be defined before handleSave which depends on it
    const fieldConfigs: Record<string, FieldConfig[]> = useMemo(() => ({
        user: [
            { name: "full_name", label: "Full Name", type: "text", required: true, placeholder: "John Doe" },
            { name: "email", label: "Email", type: "email", required: true, placeholder: "john@example.com" },
            {
                name: "role", label: "Role", type: "select", required: true, options: [
                    { value: "ADMIN", label: "Admin" },
                    { value: "MANAGER", label: "Manager" },
                    { value: "ANALYST", label: "Analyst" },
                ]
            },
            { name: "is_active", label: "Active Status", type: "checkbox", placeholder: "User is active" },
        ],
        customer: [
            { name: "name", label: "Company Name", type: "text", required: true },
            { name: "code", label: "Customer Code", type: "text", required: true, placeholder: "CUST-001" },
            { name: "address", label: "Address", type: "textarea", placeholder: "Full address" },
            { name: "phone", label: "Phone", type: "tel" },
            { name: "email", label: "Email", type: "email" },
        ],
        customer_contact: [
            { name: "name", label: "Contact Name", type: "text", required: true },
            { name: "email", label: "Email", type: "email", placeholder: "email for portal login" },
            { name: "mobile", label: "Phone", type: "tel" },
            { name: "address_override", label: "Address Override", type: "textarea", placeholder: "Override address if different from company" },
            { name: "is_primary", label: "Primary Contact", type: "checkbox", placeholder: "Set as primary contact" },
        ],
        parameter: [
            { name: "name", label: "Parameter Name", type: "text", required: true },
            { name: "default_unit_id", label: "Default Unit", type: "select", options: (units || []).map(u => ({ value: u.id, label: `${u.symbol} (${u.name || u.symbol})` })) },
            { name: "loq_default", label: "LOQ Default", type: "number", placeholder: "e.g. 0.05" },
            { name: "lod_default", label: "LOD Default", type: "number", placeholder: "e.g. 0.01" },
        ],
        matrix: [
            { name: "name", label: "Matrix Name", type: "text", required: true },
            { name: "category", label: "Category", type: "text" },
        ],
        method: [
            { name: "name", label: "Method Name", type: "text", required: true },
            { name: "code", label: "Method Code", type: "text", required: true },
            { name: "description", label: "Description", type: "textarea" },
        ],
        instrument: [
            { name: "name", label: "Instrument Name", type: "text", required: true },
            { name: "code", label: "Code", type: "text", required: true },
            { name: "location", label: "Location", type: "text" },
            {
                name: "status", label: "Status", type: "select", options: [
                    { value: "CALIBRATED", label: "Terkalibrasi" },
                    { value: "NOT_CALIBRATED", label: "Belum Terkalibrasi" },
                    { value: "IN_REPAIR", label: "Dalam Perbaikan" },
                ]
            },
            { name: "calibration_due_date", label: "Calibration Due Date", type: "date" },
        ],
        unit: [
            { name: "name", label: "Unit Name", type: "text" },
            { name: "symbol", label: "Symbol", type: "text", required: true, placeholder: "e.g. mg/L" },
        ],
        department: [
            { name: "name", label: "Department Name", type: "text", required: true },
            { name: "code", label: "Department Code", type: "text", placeholder: "e.g. CHEM, MICRO" },
            { name: "is_active", label: "Active", type: "checkbox", placeholder: "Department is active" },
        ],
        matrix_rule: [
            { name: "matrix_id", label: "Matrix", type: "select", required: true, options: (matrices || []).map(m => ({ value: m.id, label: m.name })) },
            { name: "parameter_id", label: "Parameter", type: "select", required: true, options: (parameters || []).map(p => ({ value: p.id, label: p.name })) },
            { name: "default_method_id", label: "Default Method", type: "select", options: (methods || []).map(m => ({ value: m.id, label: m.name })) },
            { name: "base_price", label: "Base Price", type: "number", placeholder: "e.g. 150000" },
            { name: "limit_type", label: "Regulasi / Limit Type", type: "text", placeholder: "e.g. Permenkes RI No 32" },
            { name: "limit_min", label: "Batas Bawah (Min)", type: "number", placeholder: "e.g. 6.5" },
            { name: "limit_max", label: "Batas Atas (Max)", type: "number", placeholder: "e.g. 8.5" },
            { name: "is_active", label: "Active", type: "checkbox", placeholder: "Rule is active" },
        ],
        test_package: [
            { name: "name", label: "Package Name", type: "text", required: true },
            { name: "matrix_id", label: "Matrix", type: "select", required: true, options: (matrices || []).map(m => ({ value: m.id, label: m.name })) },
            { name: "description", label: "Description", type: "textarea" },
            { name: "total_price", label: "Total Price", type: "number", required: true },
            { name: "tat_days", label: "TAT (Days)", type: "number", required: true },
            { name: "regulation", label: "Regulation", type: "text", placeholder: "e.g. SNI 6989.2:2019, PP 22/2021" },
            { name: "notes", label: "Notes / Keterangan", type: "textarea", placeholder: "Additional notes" },
            { name: "is_active", label: "Active", type: "checkbox", placeholder: "Package is active" },
        ],
        price_item: [
            { name: "matrix_id", label: "Matrix", type: "select", required: true, options: (matrices || []).map(m => ({ value: m.id, label: m.name })) },
            { name: "parameter_id", label: "Parameter", type: "select", required: true, options: (parameters || []).map(p => ({ value: p.id, label: p.name })) },
            { name: "price_amount", label: "Price (IDR)", type: "number", required: true, placeholder: "e.g. 150000" },
            { name: "currency", label: "Currency", type: "text", placeholder: "IDR" },
            { name: "is_active", label: "Active", type: "checkbox", placeholder: "Price is active" },
        ],
        analyst_profile: [
            { name: "user_id", label: "User", type: "select", required: true, options: (users || []).filter((u: User) => u.role === "analyst").map((u: User) => ({ value: u.id, label: u.full_name })) },
            { name: "employee_id", label: "Employee ID / NIP", type: "text", placeholder: "e.g. NIP-2024-001" },
            { name: "specialization", label: "Specialization", type: "text", placeholder: "e.g. Microbiology, Chemistry" },
            { name: "education", label: "Education", type: "text", placeholder: "e.g. S1 Kimia UNPAD" },
            { name: "years_experience", label: "Years of Experience", type: "number" },
            { name: "job_description", label: "Job Description", type: "textarea", placeholder: "Describe the role and responsibilities" },
            { name: "is_active", label: "Active", type: "checkbox", placeholder: "Profile is active" },
        ],
        analyst_competency: [
            { name: "name", label: "Metode", type: "select", required: true, options: (methods || []).map(m => ({ value: m.code ? `${m.name} (${m.code})` : m.name, label: m.code ? `${m.name} (${m.code})` : m.name })) },
            { name: "category", label: "Skill", type: "text", required: true, placeholder: "e.g. Pengoperasian GC, Analisis COD" },
            {
                name: "level", label: "Level", type: "select", options: [
                    { value: "BEGINNER", label: "Beginner" },
                    { value: "INTERMEDIATE", label: "Intermediate" },
                    { value: "ADVANCED", label: "Advanced" },
                    { value: "EXPERT", label: "Expert" },
                ]
            },
            { name: "acquired_date", label: "Tanggal Diperoleh", type: "date" },
            { name: "expiry_date", label: "Tanggal Kadaluarsa", type: "date" },
            { name: "notes", label: "Catatan", type: "textarea" },
        ],
        analyst_certificate: [
            { name: "name", label: "Certificate Name", type: "text", required: true, placeholder: "e.g. ISO 17025 Internal Auditor" },
            { name: "issuer", label: "Issuer", type: "text", placeholder: "e.g. BSN, KAN" },
            { name: "certificate_number", label: "Certificate Number", type: "text" },
            { name: "issued_date", label: "Issued Date", type: "date" },
            { name: "expiry_date", label: "Expiry Date", type: "date" },
        ],
    }), [matrices, parameters, methods, users]);

    const handleSave = useCallback(async (formData: Record<string, any>) => {
        const { mode, entityType, data } = modal;

        // Map of entity types to their CRUD hooks
        const crudMap: Record<string, { insert: any; update: any; remove: any }> = {
            user: { insert: insertUser, update: updateUser, remove: deleteUser },
            customer: { insert: insertCustomer, update: updateCustomer, remove: deleteCustomer },
            customer_contact: { insert: insertContact, update: updateContact, remove: deleteContact },
            analyst_profile: { insert: insertAnalystProfile, update: updateAnalystProfile, remove: deleteAnalystProfile },
            analyst_competency: { insert: insertCompetency, update: updateCompetency, remove: deleteCompetency },
            analyst_certificate: { insert: insertCertificate, update: updateCertificate, remove: deleteCertificate },
            parameter: { insert: insertParameter, update: updateParameter, remove: deleteParameter },
            matrix: { insert: insertMatrix, update: updateMatrix, remove: deleteMatrix },
            method: { insert: insertMethod, update: updateMethod, remove: deleteMethod },
            instrument: { insert: insertInstrument, update: updateInstrument, remove: deleteInstrument },
            unit: { insert: insertUnit, update: updateUnit, remove: deleteUnit },
            department: { insert: insertDepartment, update: updateDepartment, remove: deleteDepartment },
            matrix_rule: { insert: insertMatrixRule, update: updateMatrixRule, remove: deleteMatrixRule },
            test_package: { insert: insertTestPackage, update: updateTestPackage, remove: deleteTestPackage },
            price_item: { insert: insertPriceItem, update: updatePriceItem, remove: deletePriceItem },
        };

        const crud = crudMap[entityType];
        if (!crud) {
            console.error(`Unknown entity type: ${entityType}`);
            return;
        }

        try {
            if (mode === "delete") {
                // For test_package, also delete child items and clear expanded state
                if (entityType === "test_package") {
                    try {
                        const { supabase: sb } = await import("@/lib/supabase");
                        await sb.from("test_package_items").delete().eq("package_id", data.id);
                    } catch { /* CASCADE will handle if this fails */ }
                    if (expandedPackageId === data.id) {
                        setExpandedPackageId(null);
                        setPackageItems([]);
                    }
                }
                await crud.remove.mutateAsync(data.id);
            } else if (mode === "add") {
                // Remove fields that should be auto-generated
                const { id: _id, created_at: _created, updated_at: _updated, ...rawData } = formData;
                // Filter to only include fields defined in fieldConfigs for this entity
                const validFields = (fieldConfigs[entityType] || []).map((f: any) => f.name);
                const insertData: Record<string, any> = {};
                for (const field of validFields) {
                    if (field in rawData) {
                        insertData[field] = rawData[field];
                    }
                }
                // Inject parent FK fields from modal.data (e.g. customer_id for contacts, analyst_profile_id for competencies)
                const parentFkFields: Record<string, string[]> = {
                    customer_contact: ["customer_id"],
                    analyst_competency: ["profile_id"],
                    analyst_certificate: ["profile_id"],
                };
                for (const fk of (parentFkFields[entityType] || [])) {
                    if (data[fk] && !insertData[fk]) {
                        insertData[fk] = data[fk];
                    }
                }
                await crud.insert.mutateAsync(insertData);
            } else {
                // Edit mode — strip auto-managed fields and filter to valid fields only
                const { id: _id, created_at: _created, updated_at: _updated, ...rawData } = formData;
                const validFields = (fieldConfigs[entityType] || []).map((f: any) => f.name);
                const updateData: Record<string, any> = {};
                for (const field of validFields) {
                    if (field in rawData) {
                        updateData[field] = rawData[field];
                    }
                }
                await crud.update.mutateAsync({ id: data.id, updates: updateData });
            }
            // Re-fetch contacts for expanded customer after customer_contact CRUD
            if ((entityType === "customer_contact" || entityType === "customer") && expandedCustomerId) {
                try {
                    const { supabase: sb } = await import("@/lib/supabase");
                    const { data: freshContacts } = await sb.from("customer_contacts").select("*").eq("customer_id", expandedCustomerId).order("is_primary", { ascending: false });
                    setCustomerContacts(freshContacts || []);
                } catch { /* ignore refresh errors */ }
            }
            // Re-fetch analyst self data after competency/certificate CRUD
            if ((entityType === "analyst_competency" || entityType === "analyst_certificate") && userRole === "analyst") {
                fetchMyProfile();
            }
        } catch (err) {
            console.error(`Failed to ${mode} ${entityType}:`, err);
            throw err;
        }
    }, [modal, closeModal, fieldConfigs, expandedCustomerId, expandedPackageId, userRole, fetchMyProfile,
        insertUser, updateUser, deleteUser,
        insertCustomer, updateCustomer, deleteCustomer,
        insertParameter, updateParameter, deleteParameter,
        insertMatrix, updateMatrix, deleteMatrix,
        insertMethod, updateMethod, deleteMethod,
        insertInstrument, updateInstrument, deleteInstrument,
        insertUnit, updateUnit, deleteUnit,
        insertDepartment, updateDepartment, deleteDepartment,
        insertMatrixRule, updateMatrixRule, deleteMatrixRule,
        insertTestPackage, updateTestPackage, deleteTestPackage,
        insertPriceItem, updatePriceItem, deletePriceItem,
        insertContact, updateContact, deleteContact,
        insertAnalystProfile, updateAnalystProfile, deleteAnalystProfile,
        insertCompetency, updateCompetency, deleteCompetency,
        insertCertificate, updateCertificate, deleteCertificate
    ]);

    const handleSaveSettings = useCallback(async () => {
        try {
            await updateLabSettings.mutateAsync(settingsForm);
        } catch (err) {
            console.error("Failed to save settings:", err);
            alert("Error: Failed to save settings. Check console.");
        }
    }, [settingsForm, updateLabSettings]);


    const allTabs: { id: SettingsTab; label: string; icon: string }[] = [
        { id: "general", label: "General", icon: "settings" },
        { id: "users", label: "Users", icon: "group" },
        { id: "analysts", label: "Analysts", icon: "badge" },
        { id: "customers", label: "Customers", icon: "business" },
        { id: "departments", label: "Departments", icon: "corporate_fare" },
        { id: "parameters", label: "Parameters", icon: "science" },
        { id: "matrices", label: "Matrices", icon: "grid_view" },
        { id: "matrix_rules", label: "Matrix-Param Rules", icon: "rule" },
        { id: "methods", label: "Methods", icon: "description" },
        { id: "instruments", label: "Instruments", icon: "precision_manufacturing" },
        { id: "units", label: "Units", icon: "straighten" },
        { id: "packages", label: "Test Packages", icon: "inventory_2" },
        { id: "price_list", label: "Price List", icon: "payments" },
        // Analyst self-service tabs
        { id: "profile", label: "Profil", icon: "person" },
        { id: "competency_skills", label: "Kompetensi & Skill", icon: "verified" },
        { id: "certificates", label: "Sertifikat Kompetensi", icon: "workspace_premium" },
    ];

    const tabs = allTabs.filter(t => visibleTabs.includes(t.id));

    const filterData = <T extends { name?: string }>(data: T[]): T[] => {
        if (!searchQuery.trim()) return data;
        const q = searchQuery.toLowerCase();
        return data.filter(item => item.name?.toLowerCase().includes(q));
    };

    // Helper to find name by ID
    const findName = (list: { id: string; name: string }[], id: string | null) =>
        list.find(item => item.id === id)?.name || "—";

    return (
        <div className="space-y-6 pb-20">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-text-main dark:text-white">Settings & Master Data</h1>
                <p className="text-text-secondary">Manage system configuration and reference data</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-2 border-b border-border-light dark:border-border-dark pb-4">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                            activeTab === tab.id
                                ? "bg-primary text-white shadow-lg shadow-primary/20"
                                : "bg-slate-100 text-text-secondary hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20"
                        )}
                    >
                        <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="max-w-6xl">
                {/* General Settings */}
                {activeTab === "general" && (
                    <PremiumCard title="General Settings" subtitle="Laboratory information and preferences">
                        {loadingSettings ? (
                            <div className="p-4 text-center text-text-secondary">Loading settings...</div>
                        ) : (
                            <>
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Laboratory Name</Label>
                                            <Input
                                                value={settingsForm.lab_name}
                                                onChange={e => setSettingsForm(s => ({ ...s, lab_name: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Company Code</Label>
                                            <Input
                                                value={settingsForm.company_code}
                                                onChange={e => setSettingsForm(s => ({ ...s, company_code: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Support Email</Label>
                                            <Input
                                                type="email"
                                                value={settingsForm.support_email}
                                                onChange={e => setSettingsForm(s => ({ ...s, support_email: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Support Phone</Label>
                                            <Input
                                                type="tel"
                                                value={settingsForm.support_phone}
                                                onChange={e => setSettingsForm(s => ({ ...s, support_phone: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Address</Label>
                                            <textarea
                                                className="w-full text-sm rounded-lg border border-border-light p-3 bg-white dark:bg-white/5 dark:border-white/10"
                                                rows={3}
                                                value={settingsForm.address}
                                                onChange={e => setSettingsForm(s => ({ ...s, address: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Accreditation Number</Label>
                                            <Input
                                                value={settingsForm.accreditation_number}
                                                onChange={e => setSettingsForm(s => ({ ...s, accreditation_number: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Default Currency</Label>
                                            <select
                                                className="w-full text-sm rounded-lg border border-border-light p-3 bg-white dark:bg-surface-dark dark:border-white/10"
                                                value={settingsForm.default_currency}
                                                onChange={e => setSettingsForm(s => ({ ...s, default_currency: e.target.value }))}
                                            >
                                                <option value="IDR">IDR - Indonesian Rupiah</option>
                                                <option value="USD">USD - US Dollar</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 pt-6 border-t border-border-light dark:border-border-dark flex justify-end">
                                    <button
                                        onClick={handleSaveSettings}
                                        disabled={updateLabSettings.isPending}
                                        className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-hover disabled:opacity-50"
                                    >
                                        {updateLabSettings.isPending ? "Saving..." : "Save Changes"}
                                    </button>
                                </div>
                            </>
                        )}
                    </PremiumCard>
                )}

                {/* Users Management */}
                {activeTab === "users" && (
                    <PremiumCard
                        title="User Management"
                        subtitle="Manage laboratory personnel and access"
                        action={
                            <button
                                onClick={() => openModal("add", "user")}
                                className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium"
                            >
                                <span className="material-symbols-outlined text-[16px]">add</span>
                                Add User
                            </button>
                        }
                    >
                        {loadingUsers ? (
                            <div className="p-4 text-center text-text-secondary">Loading users...</div>
                        ) : (
                            <DenseTable
                                data={users || []}
                                keyExtractor={u => u.id}
                                columns={[
                                    { header: "Name", accessorKey: "full_name", className: "font-medium" },
                                    { header: "Email", accessorKey: "email", className: "text-sm text-text-secondary" },
                                    {
                                        header: "Role",
                                        accessorKey: "role",
                                        cell: u => (
                                            <span className={cn(
                                                "px-2 py-0.5 rounded text-xs font-bold",
                                                u.role === "ADMIN" ? "bg-primary/20 text-primary" :
                                                    u.role === "MANAGER" ? "bg-warning/20 text-warning" :
                                                        "bg-slate-100 text-slate-600"
                                            )}>
                                                {u.role}
                                            </span>
                                        )
                                    },
                                    {
                                        header: "Status",
                                        accessorKey: "is_active",
                                        cell: (u: User) => (
                                            <span className={cn(
                                                "px-2 py-0.5 rounded text-xs font-bold",
                                                u.is_active ? "bg-success/20 text-success" : "bg-slate-100 text-slate-500"
                                            )}>
                                                {u.is_active ? "Active" : "Inactive"}
                                            </span>
                                        )
                                    },
                                    {
                                        header: "Last Login",
                                        accessorKey: "last_login_at",
                                        cell: (u: User) => {
                                            if (!u.last_login_at) return <span className="text-xs text-text-secondary">—</span>;
                                            const loginDate = new Date(u.last_login_at);
                                            const now = new Date();
                                            const diffMs = now.getTime() - loginDate.getTime();
                                            const diffMin = Math.floor(diffMs / 60000);
                                            const diffHrs = Math.floor(diffMs / 3600000);
                                            const diffDays = Math.floor(diffMs / 86400000);
                                            const isOnline = diffMin < 15;
                                            const timeAgo = diffMin < 1 ? "Just now" :
                                                diffMin < 60 ? `${diffMin}m ago` :
                                                    diffHrs < 24 ? `${diffHrs}h ago` :
                                                        diffDays < 30 ? `${diffDays}d ago` :
                                                            loginDate.toLocaleDateString();
                                            return (
                                                <div className="flex items-center gap-1.5">
                                                    <span className={cn("w-2 h-2 rounded-full", isOnline ? "bg-success animate-pulse" : "bg-slate-300")} />
                                                    <span className="text-xs text-text-secondary">{timeAgo}</span>
                                                </div>
                                            );
                                        }
                                    },
                                    {
                                        header: "Actions",
                                        accessorKey: "id",
                                        cell: u => (
                                            <div className="flex gap-2">
                                                <button onClick={(e) => { e.stopPropagation(); openModal("edit", "user", u); }} className="text-primary hover:underline text-xs">Edit</button>
                                                <button onClick={(e) => { e.stopPropagation(); openModal("delete", "user", u); }} className="text-danger hover:underline text-xs">Delete</button>
                                            </div>
                                        )
                                    }
                                ]}
                            />
                        )}
                    </PremiumCard>
                )}

                {/* Customers Management */}
                {activeTab === "customers" && (
                    <PremiumCard
                        title="Customers & Contacts"
                        subtitle="Manage client information and contact persons"
                        action={
                            <button onClick={() => openModal("add", "customer")} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium">
                                <span className="material-symbols-outlined text-[16px]">add</span>
                                Add Customer
                            </button>
                        }
                    >
                        {loadingCustomers ? (
                            <div className="p-4 text-center text-text-secondary">Loading customers...</div>
                        ) : (
                            <div className="divide-y divide-border-light">
                                {(customers || []).map((c: Customer) => (
                                    <div key={c.id}>
                                        <div className="flex items-center justify-between px-4 py-3 hover:bg-bg-secondary/50 cursor-pointer" onClick={() => {
                                            if (expandedCustomerId === c.id) {
                                                setExpandedCustomerId(null);
                                                setCustomerContacts([]);
                                            } else {
                                                setExpandedCustomerId(c.id);
                                                setLoadingContacts(true);
                                                import("@/lib/supabase").then(({ supabase: sb }) => {
                                                    sb.from("customer_contacts").select("*").eq("customer_id", c.id).order("is_primary", { ascending: false }).then(({ data }: any) => {
                                                        setCustomerContacts(data || []);
                                                        setLoadingContacts(false);
                                                    });
                                                });
                                            }
                                        }}>
                                            <div className="flex items-center gap-3">
                                                <span className={cn("material-symbols-outlined text-[18px] transition-transform", expandedCustomerId === c.id && "rotate-90")}>chevron_right</span>
                                                <div>
                                                    <p className="font-medium text-sm">{c.name}</p>
                                                    <p className="text-xs text-text-secondary">{c.code || "—"} · {c.address || "—"}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={(e) => { e.stopPropagation(); openModal("edit", "customer", c); }} className="text-primary hover:underline text-xs">Edit</button>
                                                <button onClick={(e) => { e.stopPropagation(); openModal("delete", "customer", c); }} className="text-danger hover:underline text-xs">Delete</button>
                                            </div>
                                        </div>
                                        {expandedCustomerId === c.id && (
                                            <div className="px-8 pb-4 bg-bg-secondary/30">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Contact Persons</h4>
                                                    <button onClick={() => openModal("add", "customer_contact", { customer_id: c.id })} className="text-xs text-primary hover:underline flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[14px]">add</span>Add Contact
                                                    </button>
                                                </div>
                                                {loadingContacts ? (
                                                    <p className="text-xs text-text-secondary">Loading contacts...</p>
                                                ) : customerContacts.length === 0 ? (
                                                    <p className="text-xs text-text-secondary italic">No contact persons yet</p>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {customerContacts.map((ct) => (
                                                            <div key={ct.id} className="flex items-center justify-between bg-white dark:bg-white/5 rounded-lg px-3 py-2 border border-border-light">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                                        <span className="material-symbols-outlined text-primary text-[16px]">person</span>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-medium">{ct.name}{ct.is_primary && <span className="ml-1 text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded">Primary</span>}</p>
                                                                        <p className="text-xs text-text-secondary">{ct.position || "—"} · {ct.email || "—"} · {ct.phone || "—"}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <button onClick={() => openModal("edit", "customer_contact", ct)} className="text-primary hover:underline text-xs">Edit</button>
                                                                    <button onClick={() => openModal("delete", "customer_contact", ct)} className="text-danger hover:underline text-xs">Delete</button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </PremiumCard>
                )}

                {/* Parameters Management */}
                {activeTab === "parameters" && (
                    <PremiumCard
                        title="Parameters & Sub-Parameters"
                        subtitle="Analytical parameters and test specifications"
                        action={
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Search parameters..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-48"
                                />
                                <button onClick={() => openModal("add", "parameter")} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium">
                                    <span className="material-symbols-outlined text-[16px]">add</span>
                                    Add
                                </button>
                            </div>
                        }
                    >
                        {loadingParameters ? (
                            <div className="p-4 text-center text-text-secondary">Loading parameters...</div>
                        ) : (
                            <DenseTable
                                data={filterData(parameters || [])}
                                keyExtractor={p => p.id}
                                columns={[
                                    { header: "Parameter", accessorKey: "name", className: "font-medium" },
                                    {
                                        header: "Unit",
                                        accessorKey: "default_unit_id",
                                        cell: (p: Parameter) => {
                                            const u = (units || []).find(u => u.id === p.default_unit_id);
                                            return <span className="text-xs">{u?.symbol || "—"}</span>;
                                        }
                                    },
                                    {
                                        header: "LOQ",
                                        accessorKey: "loq_default",
                                        cell: (p: Parameter) => <span className="text-xs font-mono">{p.loq_default ?? "—"}</span>
                                    },
                                    {
                                        header: "LOD",
                                        accessorKey: "lod_default",
                                        cell: (p: Parameter) => <span className="text-xs font-mono">{p.lod_default ?? "—"}</span>
                                    },
                                    {
                                        header: "Actions",
                                        accessorKey: "id",
                                        cell: (p: Parameter) => (
                                            <div className="flex gap-2">
                                                <button onClick={(e) => { e.stopPropagation(); openModal("edit", "parameter", p); }} className="text-primary hover:underline text-xs">Edit</button>
                                                <button onClick={(e) => { e.stopPropagation(); openModal("delete", "parameter", p); }} className="text-danger hover:underline text-xs">Delete</button>
                                            </div>
                                        )
                                    }
                                ]}
                            />
                        )}
                    </PremiumCard>
                )}

                {/* Matrices Management */}
                {activeTab === "matrices" && (
                    <PremiumCard
                        title="Sample Matrices"
                        subtitle="Sample types and matrix categories"
                        action={
                            <button onClick={() => openModal("add", "matrix")} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium">
                                <span className="material-symbols-outlined text-[16px]">add</span>
                                Add Matrix
                            </button>
                        }
                    >
                        {loadingMatrices ? (
                            <div className="p-4 text-center text-text-secondary">Loading matrices...</div>
                        ) : (
                            <DenseTable
                                data={matrices || []}
                                keyExtractor={m => m.id}
                                columns={[
                                    { header: "Matrix Name", accessorKey: "name", className: "font-medium" },
                                    { header: "Category", accessorKey: "category", className: "text-sm" },
                                    {
                                        header: "Actions",
                                        accessorKey: "id",
                                        cell: (m: SampleMatrix) => (
                                            <div className="flex gap-2">
                                                <button onClick={(e) => { e.stopPropagation(); openModal("edit", "matrix", m); }} className="text-primary hover:underline text-xs">Edit</button>
                                                <button onClick={(e) => { e.stopPropagation(); openModal("delete", "matrix", m); }} className="text-danger hover:underline text-xs">Delete</button>
                                            </div>
                                        )
                                    }
                                ]}
                            />
                        )}
                    </PremiumCard>
                )}

                {/* Methods Management */}
                {activeTab === "methods" && (
                    <PremiumCard
                        title="Test Methods"
                        subtitle="Standard test methods and procedures"
                        action={
                            <button onClick={() => openModal("add", "method")} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium">
                                <span className="material-symbols-outlined text-[16px]">add</span>
                                Add Method
                            </button>
                        }
                    >
                        {loadingMethods ? (
                            <div className="p-4 text-center text-text-secondary">Loading methods...</div>
                        ) : (
                            <DenseTable
                                data={methods || []}
                                keyExtractor={m => m.id}
                                columns={[
                                    { header: "Method Name", accessorKey: "name", className: "font-medium" },
                                    { header: "Code", accessorKey: "code", className: "font-mono text-xs" },
                                    { header: "Description", accessorKey: "description", className: "text-sm text-text-secondary line-clamp-1" },
                                    {
                                        header: "Actions",
                                        accessorKey: "id",
                                        cell: (m: Method) => (
                                            <div className="flex gap-2">
                                                <button onClick={(e) => { e.stopPropagation(); openModal("edit", "method", m); }} className="text-primary hover:underline text-xs">Edit</button>
                                                <button onClick={(e) => { e.stopPropagation(); openModal("delete", "method", m); }} className="text-danger hover:underline text-xs">Delete</button>
                                            </div>
                                        )
                                    }
                                ]}
                            />
                        )}
                    </PremiumCard>
                )}

                {/* Instruments Management */}
                {activeTab === "instruments" && (
                    <PremiumCard
                        title="Instruments"
                        subtitle="Laboratory equipment and calibration status"
                        action={
                            <button onClick={() => openModal("add", "instrument")} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium">
                                <span className="material-symbols-outlined text-[16px]">add</span>
                                Add Instrument
                            </button>
                        }
                    >
                        {loadingInstruments ? (
                            <div className="p-4 text-center text-text-secondary">Loading instruments...</div>
                        ) : (
                            <DenseTable
                                data={instruments || []}
                                keyExtractor={i => i.id}
                                columns={[
                                    { header: "Instrument", accessorKey: "name", className: "font-medium" },
                                    { header: "Code", accessorKey: "code", className: "font-mono text-xs" },
                                    { header: "Location", accessorKey: "location", className: "text-sm text-text-secondary" },
                                    {
                                        header: "Status",
                                        accessorKey: "status",
                                        cell: (i: Instrument) => (
                                            <span className={cn(
                                                "px-2 py-0.5 rounded text-xs font-bold",
                                                i.status === "CALIBRATED" ? "bg-success/20 text-success" :
                                                    i.status === "NOT_CALIBRATED" ? "bg-warning/20 text-warning" :
                                                        "bg-danger/20 text-danger"
                                            )}>
                                                {i.status === "CALIBRATED" ? "Terkalibrasi" :
                                                    i.status === "NOT_CALIBRATED" ? "Belum Terkalibrasi" :
                                                        i.status === "IN_REPAIR" ? "Dalam Perbaikan" : (i.status || "—")}
                                            </span>
                                        )
                                    },
                                    {
                                        header: "Cal. Due",
                                        accessorKey: "calibration_due_date",
                                        cell: (i: Instrument) => {
                                            if (!i.calibration_due_date) return <span className="text-xs text-text-secondary">N/A</span>;
                                            const dueDate = new Date(i.calibration_due_date);
                                            const isOverdue = dueDate < new Date();
                                            return (
                                                <span className={cn("text-xs", isOverdue && "text-danger font-bold")}>
                                                    {dueDate.toLocaleDateString()}
                                                </span>
                                            );
                                        }
                                    },
                                    {
                                        header: "Actions",
                                        accessorKey: "id",
                                        cell: (i: Instrument) => (
                                            <div className="flex gap-2">
                                                <button onClick={(e) => { e.stopPropagation(); openModal("edit", "instrument", i); }} className="text-primary hover:underline text-xs">Edit</button>
                                                <button onClick={(e) => { e.stopPropagation(); openModal("delete", "instrument", i); }} className="text-danger hover:underline text-xs">Delete</button>
                                            </div>
                                        )
                                    }
                                ]}
                            />
                        )}
                    </PremiumCard>
                )}

                {/* Units Management */}
                {activeTab === "units" && (
                    <PremiumCard
                        title="Units of Measurement"
                        subtitle="Standard units and conversion factors"
                        action={
                            <button onClick={() => openModal("add", "unit")} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium">
                                <span className="material-symbols-outlined text-[16px]">add</span>
                                Add Unit
                            </button>
                        }
                    >
                        {loadingUnits ? (
                            <div className="p-4 text-center text-text-secondary">Loading units...</div>
                        ) : (
                            <DenseTable
                                data={units || []}
                                keyExtractor={u => u.id}
                                columns={[
                                    { header: "Unit Name", accessorKey: "name", className: "font-medium" },
                                    { header: "Symbol", accessorKey: "symbol", className: "font-mono text-lg" },
                                    {
                                        header: "Actions",
                                        accessorKey: "id",
                                        cell: (u: Unit) => (
                                            <div className="flex gap-2">
                                                <button onClick={(e) => { e.stopPropagation(); openModal("edit", "unit", u); }} className="text-primary hover:underline text-xs">Edit</button>
                                                <button onClick={(e) => { e.stopPropagation(); openModal("delete", "unit", u); }} className="text-danger hover:underline text-xs">Delete</button>
                                            </div>
                                        )
                                    }
                                ]}
                            />
                        )}
                    </PremiumCard>
                )}

                {/* Test Packages — Accordion UI */}
                {activeTab === "packages" && (
                    <PremiumCard
                        title="Test Packages"
                        subtitle="Pre-configured test bundles for quotations"
                        action={
                            <button onClick={() => openModal("add", "test_package")} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium">
                                <span className="material-symbols-outlined text-[16px]">add</span>
                                Create Package
                            </button>
                        }
                    >
                        {loadingPackages ? (
                            <div className="p-4 text-center text-text-secondary">Loading packages...</div>
                        ) : testPackages.length === 0 ? (
                            <div className="p-8 text-center text-text-secondary">
                                <span className="material-symbols-outlined text-4xl mb-2 block">inventory_2</span>
                                <p>No test packages configured yet.</p>
                                <p className="text-xs mt-1">Click &quot;Create Package&quot; to add your first package.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border-light">
                                {testPackages.map(pkg => (
                                    <div key={pkg.id}>
                                        <div className="flex items-center justify-between px-4 py-3 hover:bg-bg-secondary/50 cursor-pointer" onClick={() => {
                                            if (expandedPackageId === pkg.id) {
                                                setExpandedPackageId(null);
                                                setPackageItems([]);
                                            } else {
                                                setExpandedPackageId(pkg.id);
                                                setLoadingPackageItems(true);
                                                import("@/lib/supabase").then(({ supabase: sb }) => {
                                                    sb.from("test_package_items")
                                                        .select("*, parameters(name), methods(code, name)")
                                                        .eq("package_id", pkg.id)
                                                        .then(({ data }: any) => {
                                                            setPackageItems(data || []);
                                                            setLoadingPackageItems(false);
                                                        });
                                                });
                                            }
                                        }}>
                                            <div className="flex items-center gap-3">
                                                <span className={cn("material-symbols-outlined text-[18px] transition-transform", expandedPackageId === pkg.id && "rotate-90")}>chevron_right</span>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold text-sm">{pkg.name}</p>
                                                        <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold", pkg.is_active ? "bg-success/20 text-success" : "bg-danger/20 text-danger")}>
                                                            {pkg.is_active ? "Active" : "Inactive"}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-text-secondary">
                                                        {findName(matrices || [], pkg.matrix_id)} · {pkg.tat_days} days TAT · Rp {(pkg.total_price || 0).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={(e) => { e.stopPropagation(); openModal("edit", "test_package", pkg); }} className="text-xs text-primary hover:underline">Edit</button>
                                                <button onClick={(e) => { e.stopPropagation(); openModal("delete", "test_package", pkg); }} className="text-xs text-danger hover:underline">Delete</button>
                                            </div>
                                        </div>
                                        {expandedPackageId === pkg.id && (
                                            <div className="px-8 pb-4 bg-bg-secondary/30 space-y-3">
                                                {pkg.description && (
                                                    <p className="text-sm text-text-secondary">{pkg.description}</p>
                                                )}
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                    <div>
                                                        <p className="text-[10px] uppercase tracking-wider text-text-secondary font-semibold">Price</p>
                                                        <p className="text-sm font-bold text-primary">Rp {(pkg.total_price || 0).toLocaleString()}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] uppercase tracking-wider text-text-secondary font-semibold">TAT</p>
                                                        <p className="text-sm font-bold">{pkg.tat_days} days</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] uppercase tracking-wider text-text-secondary font-semibold">Regulation</p>
                                                        <p className="text-sm">{pkg.regulation || "—"}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] uppercase tracking-wider text-text-secondary font-semibold">Notes</p>
                                                        <p className="text-sm">{pkg.notes || "—"}</p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Parameters & Methods</h4>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setShowAddItem(!showAddItem); }}
                                                            className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                                                        >
                                                            <span className="material-symbols-outlined text-[14px]">add_circle</span>
                                                            Add Parameter
                                                        </button>
                                                    </div>
                                                    {showAddItem && (
                                                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-3 border border-blue-200 dark:border-blue-800">
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                                                <select
                                                                    value={newItemForm.parameter_id}
                                                                    onChange={e => setNewItemForm(f => ({ ...f, parameter_id: e.target.value }))}
                                                                    className="text-sm border border-border-light rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800"
                                                                >
                                                                    <option value="">Select Parameter...</option>
                                                                    {(parameters || []).map(p => (
                                                                        <option key={p.id} value={p.id}>{p.name}</option>
                                                                    ))}
                                                                </select>
                                                                <select
                                                                    value={newItemForm.method_id}
                                                                    onChange={e => setNewItemForm(f => ({ ...f, method_id: e.target.value }))}
                                                                    className="text-sm border border-border-light rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800"
                                                                >
                                                                    <option value="">Select Method...</option>
                                                                    {(methods || []).map(m => (
                                                                        <option key={m.id} value={m.id}>{m.code || m.name}</option>
                                                                    ))}
                                                                </select>
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        disabled={!newItemForm.parameter_id || !newItemForm.method_id || savingItem}
                                                                        onClick={async (e) => {
                                                                            e.stopPropagation();
                                                                            if (!newItemForm.parameter_id || !newItemForm.method_id || !expandedPackageId) return;
                                                                            setSavingItem(true);
                                                                            try {
                                                                                const { supabase: sb } = await import("@/lib/supabase");
                                                                                const { error } = await sb.from("test_package_items").insert({
                                                                                    id: crypto.randomUUID(),
                                                                                    package_id: expandedPackageId,
                                                                                    parameter_id: newItemForm.parameter_id,
                                                                                    method_id: newItemForm.method_id,
                                                                                } as any);
                                                                                if (error) {
                                                                                    console.error("[addPackageItem]", error.message, error.code, error.details);
                                                                                    alert(`Error adding parameter: ${error.message}`);
                                                                                } else {
                                                                                    // Refresh the items list
                                                                                    const { data } = await sb.from("test_package_items")
                                                                                        .select("*, parameters(name), methods(code, name)")
                                                                                        .eq("package_id", expandedPackageId);
                                                                                    setPackageItems(data || []);
                                                                                    setNewItemForm({ parameter_id: "", method_id: "" });
                                                                                    setShowAddItem(false);
                                                                                }
                                                                            } catch (err) {
                                                                                console.error("Failed to add package item:", err);
                                                                            } finally {
                                                                                setSavingItem(false);
                                                                            }
                                                                        }}
                                                                        className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium disabled:opacity-50"
                                                                    >
                                                                        {savingItem ? "Saving..." : "Add"}
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); setShowAddItem(false); setNewItemForm({ parameter_id: "", method_id: "" }); }}
                                                                        className="px-3 py-1.5 bg-slate-100 text-text-secondary rounded-lg text-xs font-medium hover:bg-slate-200"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {loadingPackageItems ? (
                                                        <p className="text-xs text-text-secondary">Loading parameters...</p>
                                                    ) : packageItems.length === 0 ? (
                                                        <p className="text-xs text-text-secondary italic">No parameters linked yet. Click &quot;Add Parameter&quot; above to link one.</p>
                                                    ) : (
                                                        <div className="grid gap-2">
                                                            {packageItems.map((item: any) => (
                                                                <div key={item.id} className="flex items-center justify-between bg-white dark:bg-white/5 rounded-lg px-3 py-2 border border-border-light">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="material-symbols-outlined text-primary text-[14px]">science</span>
                                                                        <span className="text-sm font-medium">{item.parameters?.name || "Unknown"}</span>
                                                                    </div>
                                                                    <span className="text-xs text-text-secondary font-mono">{item.methods?.code || item.methods?.name || "—"}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </PremiumCard>
                )}

                {/* Departments — Now from Supabase */}
                {activeTab === "departments" && (
                    <PremiumCard
                        title="Departments"
                        subtitle="Laboratory departments and sections"
                        action={
                            <button onClick={() => openModal("add", "department")} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium">
                                <span className="material-symbols-outlined text-[16px]">add</span>
                                Add Department
                            </button>
                        }
                    >
                        {loadingDepartments ? (
                            <div className="p-4 text-center text-text-secondary">Loading departments...</div>
                        ) : (
                            <DenseTable
                                data={departments || []}
                                keyExtractor={d => d.id}
                                columns={[
                                    { header: "Department", accessorKey: "name", className: "font-medium" },
                                    { header: "Code", accessorKey: "code", className: "font-mono text-xs" },
                                    {
                                        header: "Status",
                                        accessorKey: "is_active",
                                        cell: (d: Department) => (
                                            <span className={cn(
                                                "px-2 py-0.5 rounded text-xs font-bold",
                                                d.is_active ? "bg-success/20 text-success" : "bg-slate-100 text-slate-500"
                                            )}>
                                                {d.is_active ? "Active" : "Inactive"}
                                            </span>
                                        )
                                    },
                                    {
                                        header: "Actions",
                                        accessorKey: "id",
                                        className: "text-right",
                                        cell: (d: Department) => (
                                            <div className="flex gap-2">
                                                <button onClick={(e) => { e.stopPropagation(); openModal("edit", "department", d); }} className="text-primary hover:underline text-xs">Edit</button>
                                                <button onClick={(e) => { e.stopPropagation(); openModal("delete", "department", d); }} className="text-danger hover:underline text-xs">Delete</button>
                                            </div>
                                        )
                                    }
                                ]}
                            />
                        )}
                    </PremiumCard>
                )}

                {/* Matrix-Parameter Rules — Now from Supabase */}
                {activeTab === "matrix_rules" && (
                    <PremiumCard
                        title="Matrix-Parameter Rules"
                        subtitle="Define which parameters are allowed for each matrix type"
                        action={
                            <button onClick={() => openModal("add", "matrix_rule")} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium">
                                <span className="material-symbols-outlined text-[16px]">add</span>
                                Add Rule
                            </button>
                        }
                    >
                        {loadingMatrixRules ? (
                            <div className="p-4 text-center text-text-secondary">Loading rules...</div>
                        ) : (
                            <DenseTable
                                data={matrixRules || []}
                                keyExtractor={r => r.id}
                                columns={[
                                    {
                                        header: "Matrix",
                                        accessorKey: "matrix_id",
                                        className: "font-medium",
                                        cell: (r: MatrixParameterRule) => findName(matrices || [], r.matrix_id)
                                    },
                                    {
                                        header: "Parameter",
                                        accessorKey: "parameter_id",
                                        cell: (r: MatrixParameterRule) => findName(parameters || [], r.parameter_id)
                                    },
                                    {
                                        header: "Default Method",
                                        accessorKey: "default_method_id",
                                        cell: (r: MatrixParameterRule) => {
                                            const m = (methods || []).find(x => x.id === r.default_method_id);
                                            return m ? (m.code || m.name) : "—";
                                        }
                                    },
                                    {
                                        header: "Limits (Min - Max)",
                                        className: "w-48",
                                        cell: (r: MatrixParameterRule) => {
                                            const hasLimit = r.limit_min !== null || r.limit_max !== null;
                                            return (
                                                <div className="flex flex-col gap-0.5">
                                                    {r.limit_type && <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">{r.limit_type}</span>}
                                                    {hasLimit ? (
                                                        <span className="font-mono text-xs">{r.limit_min ?? "—"} - {r.limit_max ?? "—"}</span>
                                                    ) : (
                                                        <span className="text-xs text-text-secondary italic">No limit</span>
                                                    )}
                                                </div>
                                            );
                                        }
                                    },
                                    {
                                        header: "Base Price",
                                        accessorKey: "base_price",
                                        className: "text-right font-mono",
                                        cell: (r: MatrixParameterRule) => r.base_price ? `Rp ${r.base_price.toLocaleString()}` : "—"
                                    },
                                    {
                                        header: "Active",
                                        accessorKey: "is_active",
                                        cell: (r: MatrixParameterRule) => (
                                            <span className={cn(
                                                "px-2 py-0.5 rounded text-xs font-bold",
                                                r.is_active ? "bg-success/20 text-success" : "bg-danger/20 text-danger"
                                            )}>
                                                {r.is_active ? "Yes" : "No"}
                                            </span>
                                        )
                                    },
                                    {
                                        header: "Actions",
                                        accessorKey: "id",
                                        className: "text-right",
                                        cell: (r: MatrixParameterRule) => (
                                            <div className="flex gap-2">
                                                <button onClick={(e) => { e.stopPropagation(); openModal("edit", "matrix_rule", r); }} className="text-primary hover:underline text-xs">Edit</button>
                                                <button onClick={(e) => { e.stopPropagation(); openModal("delete", "matrix_rule", r); }} className="text-danger hover:underline text-xs">Delete</button>
                                            </div>
                                        )
                                    }
                                ]}
                            />
                        )}
                    </PremiumCard>
                )}

                {/* Price List — Now from Supabase */}
                {activeTab === "price_list" && (
                    <PremiumCard
                        title="Price List"
                        subtitle="Manage test pricing by matrix and parameter"
                        action={
                            <button onClick={() => openModal("add", "price_item")} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium">
                                <span className="material-symbols-outlined text-[16px]">add</span>
                                Add Price
                            </button>
                        }
                    >
                        {loadingPriceList ? (
                            <div className="p-4 text-center text-text-secondary">Loading price list...</div>
                        ) : (
                            <DenseTable
                                data={priceList || []}
                                keyExtractor={p => p.id}
                                columns={[
                                    {
                                        header: "Matrix",
                                        accessorKey: "matrix_id",
                                        className: "font-medium",
                                        cell: (p: PriceListItem) => findName(matrices || [], p.matrix_id)
                                    },
                                    {
                                        header: "Parameter",
                                        accessorKey: "parameter_id",
                                        cell: (p: PriceListItem) => findName(parameters || [], p.parameter_id)
                                    },
                                    {
                                        header: "Price",
                                        accessorKey: "price_amount",
                                        className: "text-right font-mono",
                                        cell: (p: PriceListItem) => `Rp ${(p.price_amount || 0).toLocaleString()}`
                                    },
                                    {
                                        header: "Currency",
                                        accessorKey: "currency",
                                        className: "text-center text-xs",
                                    },
                                    {
                                        header: "Active",
                                        accessorKey: "is_active",
                                        cell: (p: PriceListItem) => (
                                            <span className={cn(
                                                "px-2 py-0.5 rounded text-xs font-bold",
                                                p.is_active ? "bg-success/20 text-success" : "bg-slate-100 text-slate-500"
                                            )}>
                                                {p.is_active ? "Active" : "Inactive"}
                                            </span>
                                        )
                                    },
                                    {
                                        header: "Actions",
                                        accessorKey: "id",
                                        className: "text-right",
                                        cell: (p: PriceListItem) => (
                                            <div className="flex gap-2">
                                                <button onClick={(e) => { e.stopPropagation(); openModal("edit", "price_item", p); }} className="text-primary hover:underline text-xs">Edit</button>
                                                <button onClick={(e) => { e.stopPropagation(); openModal("delete", "price_item", p); }} className="text-danger hover:underline text-xs">Delete</button>
                                            </div>
                                        )
                                    }
                                ]}
                            />
                        )}
                    </PremiumCard>
                )}

                {/* Analysts Profiles — Admin/Manager only */}
                {activeTab === "analysts" && (
                    <PremiumCard
                        title="Analyst Profiles"
                        subtitle="Manage analyst competencies, qualifications, and certificates"
                        action={
                            <button onClick={() => openModal("add", "analyst_profile")} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium">
                                <span className="material-symbols-outlined text-[16px]">add</span>
                                Add Analyst
                            </button>
                        }
                    >
                        {loadingAnalysts ? (
                            <div className="p-4 text-center text-text-secondary">Loading analyst profiles...</div>
                        ) : analystProfiles.length === 0 ? (
                            <div className="p-8 text-center text-text-secondary">
                                <span className="material-symbols-outlined text-4xl mb-2 block">badge</span>
                                <p>No analyst profiles yet.</p>
                                <p className="text-xs mt-1">Add analyst profiles to track competencies and certificates.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border-light">
                                {analystProfiles.map(ap => (
                                    <div key={ap.id}>
                                        <div className="flex items-center justify-between px-4 py-3 hover:bg-bg-secondary/50 cursor-pointer" onClick={() => {
                                            if (expandedAnalystId === ap.id) {
                                                setExpandedAnalystId(null);
                                                setAnalystCompetencies([]);
                                                setAnalystCertificates([]);
                                            } else {
                                                setExpandedAnalystId(ap.id);
                                                setLoadingAnalystDetails(true);
                                                import("@/lib/supabase").then(({ supabase: sb }) => {
                                                    Promise.all([
                                                        sb.from("analyst_competencies").select("*").eq("profile_id", ap.id).order("name"),
                                                        sb.from("analyst_certificates").select("*").eq("profile_id", ap.id).order("name"),
                                                    ]).then(([compRes, certRes]) => {
                                                        setAnalystCompetencies(compRes.data || []);
                                                        setAnalystCertificates(certRes.data || []);
                                                        setLoadingAnalystDetails(false);
                                                    });
                                                });
                                            }
                                        }}>
                                            <div className="flex items-center gap-3">
                                                <span className={cn("material-symbols-outlined text-[18px] transition-transform", expandedAnalystId === ap.id && "rotate-90")}>chevron_right</span>
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-primary text-[20px]">person</span>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm">{ap.users?.full_name || "Unknown"}</p>
                                                    <p className="text-xs text-text-secondary">
                                                        {ap.employee_id || "—"} · {ap.specialization || "—"} · {ap.years_experience || 0} yrs exp
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={(e) => { e.stopPropagation(); openModal("edit", "analyst_profile", ap); }} className="text-primary hover:underline text-xs">Edit</button>
                                                <button onClick={(e) => { e.stopPropagation(); openModal("delete", "analyst_profile", ap); }} className="text-danger hover:underline text-xs">Delete</button>
                                            </div>
                                        </div>
                                        {expandedAnalystId === ap.id && (
                                            <div className="px-8 pb-4 bg-bg-secondary/30 space-y-4">
                                                {/* Profile details grid */}
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                                                    <div>
                                                        <p className="text-[10px] uppercase tracking-wider text-text-secondary font-semibold">Email</p>
                                                        <p className="text-sm">{ap.users?.email || "—"}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] uppercase tracking-wider text-text-secondary font-semibold">Education</p>
                                                        <p className="text-sm">{ap.education || "—"}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] uppercase tracking-wider text-text-secondary font-semibold">Specialization</p>
                                                        <p className="text-sm">{ap.specialization || "—"}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] uppercase tracking-wider text-text-secondary font-semibold">Status</p>
                                                        <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-bold", ap.is_active ? "bg-success/20 text-success" : "bg-danger/20 text-danger")}>
                                                            {ap.is_active ? "Active" : "Inactive"}
                                                        </span>
                                                    </div>
                                                </div>
                                                {ap.job_description && (
                                                    <div>
                                                        <p className="text-[10px] uppercase tracking-wider text-text-secondary font-semibold mb-1">Job Description</p>
                                                        <p className="text-sm text-text-secondary whitespace-pre-wrap">{ap.job_description}</p>
                                                    </div>
                                                )}

                                                {loadingAnalystDetails ? (
                                                    <p className="text-xs text-text-secondary">Loading details...</p>
                                                ) : (
                                                    <>
                                                        {/* Competencies */}
                                                        <div>
                                                            <div className="flex items-center justify-between mb-2">
                                                                <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Kompetensi (Metode & Skill)</h4>
                                                                <button onClick={() => openModal("add", "analyst_competency", { profile_id: ap.id })} className="text-xs text-primary hover:underline flex items-center gap-1">
                                                                    <span className="material-symbols-outlined text-[14px]">add</span>Add Competency
                                                                </button>
                                                            </div>
                                                            {analystCompetencies.length === 0 ? (
                                                                <p className="text-xs text-text-secondary italic">No competencies recorded yet</p>
                                                            ) : (
                                                                <div className="grid gap-2">
                                                                    {analystCompetencies.map(comp => (
                                                                        <div key={comp.id} className="flex items-center justify-between bg-white dark:bg-white/5 rounded-lg px-3 py-2 border border-border-light">
                                                                            <div className="flex items-center gap-3">
                                                                                <span className="material-symbols-outlined text-primary text-[14px]">verified</span>
                                                                                <div>
                                                                                    <p className="text-sm font-medium">{comp.name}
                                                                                        {comp.level && <span className={cn("ml-2 text-[10px] px-1.5 py-0.5 rounded font-bold",
                                                                                            comp.level === "EXPERT" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" :
                                                                                                comp.level === "ADVANCED" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                                                                                                    comp.level === "INTERMEDIATE" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" :
                                                                                                        "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                                                                                        )}>{comp.level}</span>}
                                                                                    </p>
                                                                                    <p className="text-xs text-text-secondary">Skill: {comp.category || "—"}{comp.expiry_date ? ` · Expires ${new Date(comp.expiry_date).toLocaleDateString()}` : ""}</p>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex gap-2">
                                                                                <button onClick={() => openModal("edit", "analyst_competency", comp)} className="text-primary hover:underline text-xs">Edit</button>
                                                                                <button onClick={() => openModal("delete", "analyst_competency", comp)} className="text-danger hover:underline text-xs">Delete</button>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Certificates */}
                                                        <div>
                                                            <div className="flex items-center justify-between mb-2">
                                                                <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Sertifikat Kompetensi</h4>
                                                                <button onClick={() => openModal("add", "analyst_certificate", { profile_id: ap.id })} className="text-xs text-primary hover:underline flex items-center gap-1">
                                                                    <span className="material-symbols-outlined text-[14px]">add</span>Add Certificate
                                                                </button>
                                                            </div>
                                                            {analystCertificates.length === 0 ? (
                                                                <p className="text-xs text-text-secondary italic">No certificates recorded yet</p>
                                                            ) : (
                                                                <div className="grid gap-2">
                                                                    {analystCertificates.map(cert => (
                                                                        <div key={cert.id} className="flex items-center justify-between bg-white dark:bg-white/5 rounded-lg px-3 py-2 border border-border-light">
                                                                            <div className="flex items-center gap-3">
                                                                                <span className="material-symbols-outlined text-primary text-[14px]">workspace_premium</span>
                                                                                <div>
                                                                                    <p className="text-sm font-medium">{cert.name}</p>
                                                                                    <p className="text-xs text-text-secondary">
                                                                                        {cert.issuer || "—"} · #{cert.certificate_number || "—"}
                                                                                        {cert.expiry_date ? ` · Expires ${new Date(cert.expiry_date).toLocaleDateString()}` : ""}
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex gap-2">
                                                                                <button onClick={() => openModal("edit", "analyst_certificate", cert)} className="text-primary hover:underline text-xs">Edit</button>
                                                                                <button onClick={() => openModal("delete", "analyst_certificate", cert)} className="text-danger hover:underline text-xs">Delete</button>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </PremiumCard>
                )}

                {/* ===== ANALYST SELF-SERVICE TABS ===== */}

                {/* Profile Tab - Analyst edits own profile */}
                {activeTab === "profile" && (
                    <PremiumCard title="Profil Analis" subtitle="Data profil Anda sebagai analis laboratorium">
                        {loadingMyProfile ? (
                            <div className="p-4 text-center text-text-secondary">Loading profil...</div>
                        ) : (
                            <>
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Nama</Label>
                                            <Input value={authUser?.full_name || "—"} disabled className="bg-slate-50 dark:bg-white/5" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Email</Label>
                                            <Input value={authUser?.email || "—"} disabled className="bg-slate-50 dark:bg-white/5" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>NIP / Employee ID</Label>
                                            <Input
                                                value={myProfileForm.employee_id}
                                                onChange={e => setMyProfileForm(s => ({ ...s, employee_id: e.target.value }))}
                                                placeholder="e.g. NIP-2024-001"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Spesialisasi</Label>
                                            <Input
                                                value={myProfileForm.specialization}
                                                onChange={e => setMyProfileForm(s => ({ ...s, specialization: e.target.value }))}
                                                placeholder="e.g. Kimia Analitik, Mikrobiologi"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Pendidikan</Label>
                                            <Input
                                                value={myProfileForm.education}
                                                onChange={e => setMyProfileForm(s => ({ ...s, education: e.target.value }))}
                                                placeholder="e.g. S1 Kimia UNPAD"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Pengalaman (tahun)</Label>
                                            <Input
                                                type="number"
                                                value={myProfileForm.years_experience}
                                                onChange={e => setMyProfileForm(s => ({ ...s, years_experience: parseInt(e.target.value) || 0 }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Deskripsi Pekerjaan</Label>
                                            <textarea
                                                className="w-full text-sm rounded-lg border border-border-light p-3 bg-white dark:bg-white/5 dark:border-white/10"
                                                rows={3}
                                                value={myProfileForm.job_description}
                                                onChange={e => setMyProfileForm(s => ({ ...s, job_description: e.target.value }))}
                                                placeholder="Tugas dan tanggung jawab utama"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 pt-6 border-t border-border-light dark:border-border-dark flex justify-end">
                                    <button
                                        onClick={handleSaveMyProfile}
                                        disabled={savingProfile}
                                        className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-hover disabled:opacity-50"
                                    >
                                        {savingProfile ? "Menyimpan..." : "Simpan Profil"}
                                    </button>
                                </div>
                            </>
                        )}
                    </PremiumCard>
                )}

                {/* Competency & Skill Matrix Tab */}
                {activeTab === "competency_skills" && (
                    <PremiumCard
                        title="Kompetensi & Skill Matrix"
                        subtitle="Daftar kompetensi berdasarkan metode dan skill Anda"
                        action={
                            myProfile ? (
                                <button onClick={() => openModal("add", "analyst_competency", { profile_id: myProfile.id })} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium">
                                    <span className="material-symbols-outlined text-[16px]">add</span>
                                    Tambah Kompetensi
                                </button>
                            ) : null
                        }
                    >
                        {loadingMyDetails ? (
                            <div className="p-4 text-center text-text-secondary">Loading data...</div>
                        ) : myCompetencies.length === 0 ? (
                            <div className="p-8 text-center text-text-secondary">
                                <span className="material-symbols-outlined text-4xl mb-2 block opacity-40">verified</span>
                                <p>Belum ada data kompetensi.</p>
                                <p className="text-xs mt-1">Klik &quot;Tambah Kompetensi&quot; untuk menambah data.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border-light dark:border-border-dark text-left text-text-secondary">
                                            <th className="pb-3 font-medium">Metode</th>
                                            <th className="pb-3 font-medium">Skill</th>
                                            <th className="pb-3 font-medium">Level</th>
                                            <th className="pb-3 font-medium">Tgl Diperoleh</th>
                                            <th className="pb-3 font-medium">Tgl Kadaluarsa</th>
                                            <th className="pb-3 font-medium text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border-light dark:divide-border-dark">
                                        {myCompetencies.map(comp => (
                                            <tr key={comp.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                                                <td className="py-3 font-medium">{comp.name || "—"}</td>
                                                <td className="py-3">{comp.category || "—"}</td>
                                                <td className="py-3">
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded-full text-xs font-medium",
                                                        comp.level === "EXPERT" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" :
                                                            comp.level === "ADVANCED" ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400" :
                                                                comp.level === "INTERMEDIATE" ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400" :
                                                                    "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-400"
                                                    )}>
                                                        {comp.level || "—"}
                                                    </span>
                                                </td>
                                                <td className="py-3">{comp.acquired_date ? new Date(comp.acquired_date).toLocaleDateString("id-ID") : "—"}</td>
                                                <td className="py-3">{comp.expiry_date ? new Date(comp.expiry_date).toLocaleDateString("id-ID") : "—"}</td>
                                                <td className="py-3 text-right">
                                                    <div className="flex gap-2 justify-end">
                                                        <button onClick={() => openModal("edit", "analyst_competency", comp)} className="text-primary hover:underline text-xs">Edit</button>
                                                        <button onClick={() => openModal("delete", "analyst_competency", comp)} className="text-danger hover:underline text-xs">Hapus</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </PremiumCard>
                )}

                {/* Certificate of Competency Tab */}
                {activeTab === "certificates" && (
                    <PremiumCard
                        title="Sertifikat Kompetensi"
                        subtitle="Data sertifikat dan dokumen pendukung kompetensi Anda"
                        action={
                            myProfile ? (
                                <button onClick={() => openModal("add", "analyst_certificate", { profile_id: myProfile.id })} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium">
                                    <span className="material-symbols-outlined text-[16px]">add</span>
                                    Tambah Sertifikat
                                </button>
                            ) : null
                        }
                    >
                        {loadingMyDetails ? (
                            <div className="p-4 text-center text-text-secondary">Loading data...</div>
                        ) : myCertificates.length === 0 ? (
                            <div className="p-8 text-center text-text-secondary">
                                <span className="material-symbols-outlined text-4xl mb-2 block opacity-40">workspace_premium</span>
                                <p>Belum ada data sertifikat.</p>
                                <p className="text-xs mt-1">Klik &quot;Tambah Sertifikat&quot; untuk menambah data.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {myCertificates.map(cert => (
                                    <div key={cert.id} className="flex items-start justify-between p-4 rounded-xl border border-border-light dark:border-border-dark hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-500/20">
                                                <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[20px]">workspace_premium</span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-text-main dark:text-white">{cert.name}</p>
                                                <p className="text-xs text-text-secondary mt-0.5">
                                                    {cert.issuer || "—"} · #{cert.certificate_number || "—"}
                                                    {cert.issued_date ? ` · Issued ${new Date(cert.issued_date).toLocaleDateString("id-ID")}` : ""}
                                                    {cert.expiry_date ? ` · Expires ${new Date(cert.expiry_date).toLocaleDateString("id-ID")}` : ""}
                                                </p>
                                                {/* Document link or upload */}
                                                <div className="mt-2 flex items-center gap-2">
                                                    {cert.document_url ? (
                                                        <a
                                                            href={cert.document_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1 text-xs text-primary hover:underline"
                                                        >
                                                            <span className="material-symbols-outlined text-[14px]">attach_file</span>
                                                            {cert.document_name || "Lihat Dokumen"}
                                                        </a>
                                                    ) : (
                                                        <span className="text-xs text-text-secondary italic">Belum ada dokumen</span>
                                                    )}
                                                    <label className={cn(
                                                        "flex items-center gap-1 text-xs cursor-pointer px-2 py-1 rounded-md transition-colors",
                                                        "bg-slate-100 hover:bg-slate-200 text-text-secondary dark:bg-white/10 dark:hover:bg-white/20",
                                                        uploadingCert && "opacity-50 pointer-events-none"
                                                    )}>
                                                        <span className="material-symbols-outlined text-[14px]">upload_file</span>
                                                        {uploadingCert ? "Uploading..." : cert.document_url ? "Ganti" : "Upload"}
                                                        <input
                                                            type="file"
                                                            className="hidden"
                                                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                                            onChange={e => {
                                                                const file = e.target.files?.[0];
                                                                if (file) handleCertUpload(cert.id, file);
                                                                e.target.value = "";
                                                            }}
                                                        />
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            <button onClick={() => openModal("edit", "analyst_certificate", cert)} className="text-primary hover:underline text-xs">Edit</button>
                                            <button onClick={() => openModal("delete", "analyst_certificate", cert)} className="text-danger hover:underline text-xs">Hapus</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </PremiumCard>
                )}
            </div>

            {/* CRUD Modal */}
            <CrudModal
                isOpen={modal.isOpen}
                onClose={closeModal}
                title={`${modal.mode === "add" ? "Add" : modal.mode === "edit" ? "Edit" : "Delete"} ${modal.entityType.charAt(0).toUpperCase() + modal.entityType.slice(1).replace(/_/g, " ")}`}
                mode={modal.mode}
                fields={fieldConfigs[modal.entityType] || []}
                initialData={modal.data}
                onSave={handleSave}
                entityName={modal.entityType}
            />
        </div>
    );
}
