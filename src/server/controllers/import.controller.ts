import { importService } from "../services/import.service";
import { memberRepository } from "../repositories/member.repository";
import { preRegistrationRepository } from "../repositories/preRegistration.repository";

const MAX_CSV_CHARS = 5 * 1024 * 1024;

function formatError(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export class ImportController {
  async handleImportMembersCsv(csvText: string) {
    try {
      if (!csvText || !csvText.trim()) {
        throw new Error("CSV content is empty.");
      }
      if (csvText.length > MAX_CSV_CHARS) {
        throw new Error("CSV file is too large (max 5 MB). Split it into smaller files.");
      }
      const summary = await importService.importAssociationMembersCsv(csvText);
      return {
        success: true,
        data: summary,
        message: `Processed ${summary.totalRows} rows (${summary.importedCount} saved/updated).`,
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: formatError(err, "Failed to import association members CSV"),
      };
    }
  }

  async handleListMembers(params: { search?: string; membershipType?: string }) {
    try {
      const [members, totalCount] = await Promise.all([
        memberRepository.listMembers({
          search: params.search,
          membershipType: params.membershipType,
          limit: 200,
        }),
        memberRepository.getMemberCount(),
      ]);
      return { success: true, data: members, totalCount };
    } catch (err: unknown) {
      return {
        success: false,
        error: formatError(err, "Failed to fetch association members"),
      };
    }
  }

  async handleImportPreRegistrationsCsv(eventId: number, csvText: string) {
    try {
      if (!eventId || isNaN(eventId)) {
        throw new Error("Please select a valid target event before importing.");
      }
      if (!csvText || !csvText.trim()) {
        throw new Error("CSV content is empty.");
      }
      if (csvText.length > MAX_CSV_CHARS) {
        throw new Error("CSV file is too large (max 5 MB). Split it into smaller files.");
      }
      const summary = await importService.importPreRegistrationsCsv(
        eventId,
        csvText
      );
      return {
        success: true,
        data: summary,
        message: `Processed ${summary.totalRows} rows for event #${eventId}: ${summary.importedCount} saved/updated, ${summary.linkedMembersCount ?? 0} matched to association members.`,
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: formatError(err, "Failed to import pre-registrations CSV"),
      };
    }
  }

  async handleListPreRegistrations(params: {
    eventId: number;
    search?: string;
    responseStatus?: string;
  }) {
    try {
      const [records, totalCount] = await Promise.all([
        preRegistrationRepository.listByEvent(params.eventId, {
          search: params.search,
          responseStatus: params.responseStatus,
          limit: 200,
        }),
        preRegistrationRepository.getCountByEvent(params.eventId),
      ]);
      return { success: true, data: records, totalCount };
    } catch (err: unknown) {
      return {
        success: false,
        error: formatError(err, "Failed to fetch pre-registrations"),
      };
    }
  }
}

export const importController = new ImportController();
